import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  CancellationReasonType,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  RefundStatus,
  Role,
} from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface ServiceFeeAnalyticsRestaurant {
  restaurantId: string;
  restaurantName: string;
  totalServiceFeeLifetime: number;
  totalServiceFeeCurrentMonth: number;
  totalCardFees: number;
  contributingOrdersCount: number;
}

export interface ServiceFeeAnalyticsResponse {
  serviceFeeEnabled: boolean;
  restaurants: ServiceFeeAnalyticsRestaurant[];
}

export interface OutstandingServiceFeeRestaurant {
  restaurantId: string;
  restaurantName: string;
  outstandingServiceFee: number;
  completedOrdersCount: number;
}

export interface CollectOutstandingServiceFeeResponse {
  restaurantId: string;
  collectedAmount: number;
  ordersAffectedCount: number;
}

interface FindRestaurantOrdersFilters {
  status?: OrderStatus;
  statuses?: OrderStatus[];
  search?: string;
  sinceHours?: number;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
  restaurantId?: string;
}

type PaginatedOrdersResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationService: NotificationService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async create(studentId: string, createOrderDto: CreateOrderDto) {
    const { restaurantId, items } = createOrderDto;
    const cardLast4 = this.resolveCardLast4(createOrderDto);

    let order: Prisma.OrderGetPayload<{
      include: {
        items: true;
        restaurant: { select: { name: true } };
      };
    }>;
    try {
      order = await this.prisma.$transaction(
        async (tx) => {
          const student = await tx.user.findUnique({
            where: { id: studentId },
            select: { isVerified: true },
          });

          if (!student?.isVerified) {
            throw new ForbiddenException('Email not verified');
          }

          const restaurant = await tx.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
              id: true,
              isOpen: true,
              isDisabled: true,
              openTime: true,
              closeTime: true,
              maxConcurrentOrders: true,
              university: {
                select: {
                  isActive: true,
                },
              },
            },
          });

          if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
          }

          let config = await tx.globalConfig.findUnique({
            where: { id: 1 },
          });
          if (!config) {
            config = await tx.globalConfig.create({
              data: {
                id: 1,
                serviceFeeEnabled: false,
                serviceFeeAmount: 3.0,
              },
            });
          }

          if (!config.orderingEnabled) {
            throw new ForbiddenException('Ordering is currently disabled');
          }

          if (config.maintenanceMode) {
            throw new ForbiddenException(
              'Ordering is temporarily unavailable during maintenance',
            );
          }

          if (restaurant.isDisabled) {
            throw new ForbiddenException(
              'This restaurant is temporarily disabled.',
            );
          }

          if (!restaurant.university.isActive) {
            throw new ForbiddenException(
              'This university is currently inactive.',
            );
          }

          if (this.isPastClosingTime(restaurant.openTime, restaurant.closeTime)) {
            if (restaurant.isOpen) {
              await tx.restaurant.update({
                where: { id: restaurant.id },
                data: { isOpen: false },
              });
            }

            throw new BadRequestException('Restaurant is currently closed');
          }

          if (!restaurant.isOpen) {
            throw new BadRequestException('Restaurant is currently closed');
          }

          if (restaurant.maxConcurrentOrders > 0) {
            const activeOrdersCount = await tx.order.count({
              where: {
                restaurantId,
                status: {
                  in: [OrderStatus.RECEIVED, OrderStatus.PREPARING],
                },
              },
            });

            if (activeOrdersCount >= restaurant.maxConcurrentOrders) {
              throw new BadRequestException(
                'Restaurant is busy and cannot accept new orders at the moment',
              );
            }
          }

          let subtotal = 0;
          const orderItemsData: any[] = [];

          for (const item of items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              include: { extras: true },
            });

            if (!product) {
              throw new BadRequestException(`Product ${item.productId} not found`);
            }

            if (product.restaurantId !== restaurantId) {
              throw new BadRequestException(
                `Product ${product.name} does not belong to this restaurant`,
              );
            }

            if (product.manuallyOutOfStock) {
              throw new BadRequestException(`Product ${product.name} is out of stock`);
            }

            let itemPrice = product.price;
            const extrasSnapshot: any[] = [];

            if (item.sauces && item.sauces.length > 0) {
              for (const sauceId of item.sauces) {
                const sauce = product.extras.find((e) => e.id === sauceId);
                if (sauce) {
                  itemPrice += sauce.price;
                  extrasSnapshot.push({
                    id: sauce.id,
                    name: sauce.name,
                    price: sauce.price,
                    type: 'sauce',
                  });
                }
              }
            }

            if (item.addOns && item.addOns.length > 0) {
              for (const addOnId of item.addOns) {
                const addOn = product.extras.find((e) => e.id === addOnId);
                if (addOn) {
                  itemPrice += addOn.price;
                  extrasSnapshot.push({
                    id: addOn.id,
                    name: addOn.name,
                    price: addOn.price,
                    type: 'addon',
                  });
                }
              }
            }

            subtotal += itemPrice * item.quantity;
            orderItemsData.push({
              productId: product.id,
              quantity: item.quantity,
              priceSnapshot: itemPrice,
              extrasSnapshot:
                extrasSnapshot.length > 0 ? extrasSnapshot : undefined,
              comment: item.comment,
            });

            if (product.hasStock && product.stockQuantity !== null) {
              const stockUpdate = await tx.product.updateMany({
                where: {
                  id: product.id,
                  hasStock: true,
                  manuallyOutOfStock: false,
                  stockQuantity: { gte: item.quantity },
                },
                data: { stockQuantity: { decrement: item.quantity } },
              });

              if (stockUpdate.count === 0) {
                throw new BadRequestException(
                  `Product ${product.name} is out of stock`,
                );
              }
            }
          }

          const serviceFee = config.serviceFeeEnabled ? config.serviceFeeAmount : 0;
          const total = subtotal + serviceFee;

          return tx.order.create({
            data: {
              studentId,
              restaurantId,
              subtotal,
              serviceFee,
              total,
              paymentMethod: PaymentMethod.CARD,
              paymentStatus: PaymentStatus.PAID,
              cardLast4,
              status: OrderStatus.RECEIVED,
              items: {
                create: orderItemsData,
              },
            },
            include: {
              items: true,
              restaurant: { select: { name: true } },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Order placement conflicted with another update. Please retry.',
        );
      }
      throw error;
    }

    this.safeEmitOrderNew(order);

    return order;
  }

  async findAllByStudent(studentId: string) {
    return this.prisma.order.findMany({
      where: { studentId },
      include: {
        restaurant: {
          select: { name: true },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByRestaurant(
    restaurantId: string,
    filters: FindRestaurantOrdersFilters = {},
  ) {
    const where: Prisma.OrderWhereInput = { restaurantId };
    const andFilters: Prisma.OrderWhereInput[] = [];

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    } else if (filters.status) {
      where.status = filters.status;
    }

    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (
      typeof filters.sinceHours === 'number' &&
      Number.isFinite(filters.sinceHours) &&
      filters.sinceHours > 0
    ) {
      createdAtFilter.gte = new Date(
        Date.now() - filters.sinceHours * 60 * 60 * 1000,
      );
    }

    if (filters.from) {
      createdAtFilter.gte = filters.from;
    }

    if (filters.to) {
      createdAtFilter.lte = filters.to;
    }

    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    const normalizedSearch = filters.search?.trim();
    if (normalizedSearch) {
      const searchConditions: Prisma.OrderWhereInput[] = [
        {
          posOrderNumber: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
      ];

      if (/^\d+$/.test(normalizedSearch)) {
        searchConditions.push({
          orderNumber: Number.parseInt(normalizedSearch, 10),
        });
      }

      andFilters.push({ OR: searchConditions });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const include = {
      student: {
        select: { email: true, name: true },
      },
      restaurant: {
        select: { id: true, name: true },
      },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    } satisfies Prisma.OrderInclude;

    const shouldPaginate =
      typeof filters.page === 'number' || typeof filters.pageSize === 'number';

    if (!shouldPaginate) {
      return this.prisma.order.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
      });
    }

    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    } satisfies PaginatedOrdersResponse<(typeof items)[number]>;
  }

  async findAllForAdmin(
    filters: FindRestaurantOrdersFilters = {},
  ): Promise<PaginatedOrdersResponse<any>> {
    const where: Prisma.OrderWhereInput = {};
    const andFilters: Prisma.OrderWhereInput[] = [];

    if (filters.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    } else if (filters.status) {
      where.status = filters.status;
    }

    const createdAtFilter: Prisma.DateTimeFilter = {};

    if (
      typeof filters.sinceHours === 'number' &&
      Number.isFinite(filters.sinceHours) &&
      filters.sinceHours > 0
    ) {
      createdAtFilter.gte = new Date(
        Date.now() - filters.sinceHours * 60 * 60 * 1000,
      );
    }

    if (filters.from) {
      createdAtFilter.gte = filters.from;
    }

    if (filters.to) {
      createdAtFilter.lte = filters.to;
    }

    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    const normalizedSearch = filters.search?.trim();
    if (normalizedSearch) {
      const searchConditions: Prisma.OrderWhereInput[] = [
        {
          posOrderNumber: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
        {
          restaurant: {
            name: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        },
        {
          student: {
            email: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        },
      ];

      if (/^\d+$/.test(normalizedSearch)) {
        searchConditions.push({
          orderNumber: Number.parseInt(normalizedSearch, 10),
        });
      }

      andFilters.push({ OR: searchConditions });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const include = {
      student: {
        select: { id: true, email: true, name: true },
      },
      restaurant: {
        select: { id: true, name: true },
      },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    } satisfies Prisma.OrderInclude;

    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async countPendingOrdersForRestaurant(restaurantId: string) {
    // Incoming queue includes both newly received and actively preparing orders.
    const pendingOrders = await this.prisma.order.count({
      where: {
        restaurantId,
        status: {
          in: [OrderStatus.RECEIVED, OrderStatus.PREPARING],
        },
      },
    });

    return { pendingOrders };
  }

  async updatePosOrderNumber(
    orderId: string,
    userId: string,
    role: Role,
    posOrderNumber?: string,
  ) {
    if (role !== Role.RESTAURANT_ADMIN) {
      throw new ForbiddenException('Only restaurant admins can update POS reference');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, restaurantId: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const userRestaurantId = await this.getRestaurantIdForUser(userId);
    if (!userRestaurantId || order.restaurantId !== userRestaurantId) {
      throw new ForbiddenException('Access denied');
    }

    const normalizedPosOrderNumber = posOrderNumber?.trim();

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        posOrderNumber: normalizedPosOrderNumber
          ? normalizedPosOrderNumber
          : null,
      },
    });
  }

  async getServiceFeeAnalytics(): Promise<ServiceFeeAnalyticsResponse> {
    const config = await this.configService.getSettings();

    if (!config.serviceFeeEnabled) {
      return {
        serviceFeeEnabled: false,
        restaurants: [],
      };
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [restaurants, contributingOrders] = await Promise.all([
      this.prisma.restaurant.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
        },
        select: {
          restaurantId: true,
          paymentMethod: true,
          status: true,
          serviceFee: true,
          createdAt: true,
        },
      }),
    ]);

    const analyticsByRestaurant = new Map<string, ServiceFeeAnalyticsRestaurant>();

    for (const restaurant of restaurants) {
      analyticsByRestaurant.set(restaurant.id, {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        totalServiceFeeLifetime: 0,
        totalServiceFeeCurrentMonth: 0,
        totalCardFees: 0,
        contributingOrdersCount: 0,
      });
    }

    for (const order of contributingOrders) {
      const analytics = analyticsByRestaurant.get(order.restaurantId);
      if (!analytics) {
        continue;
      }

      const fee = Number(order.serviceFee || 0);
      analytics.totalServiceFeeLifetime += fee;
      analytics.contributingOrdersCount += 1;

      if (order.paymentMethod === PaymentMethod.CARD) {
        analytics.totalCardFees += fee;
      }

      if (order.createdAt >= currentMonthStart && order.createdAt <= now) {
        analytics.totalServiceFeeCurrentMonth += fee;
      }
    }

    const restaurantsAnalytics = restaurants.map((restaurant) => {
      const analytics = analyticsByRestaurant.get(restaurant.id)!;
      return {
        ...analytics,
        totalServiceFeeLifetime: Number(
          analytics.totalServiceFeeLifetime.toFixed(2),
        ),
        totalServiceFeeCurrentMonth: Number(
          analytics.totalServiceFeeCurrentMonth.toFixed(2),
        ),
        totalCardFees: Number(analytics.totalCardFees.toFixed(2)),
      };
    });

    return {
      serviceFeeEnabled: true,
      restaurants: restaurantsAnalytics,
    };
  }

  async getOutstandingServiceFeeByRestaurant(): Promise<
    OutstandingServiceFeeRestaurant[]
  > {
    const where = this.buildOutstandingServiceFeeWhere();
    const grouped = await this.prisma.order.groupBy({
      by: ['restaurantId'],
      where,
      _sum: {
        serviceFee: true,
      },
      _count: {
        _all: true,
      },
    });

    if (grouped.length === 0) {
      return [];
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        id: {
          in: grouped.map((group) => group.restaurantId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const namesByRestaurantId = new Map(
      restaurants.map((restaurant) => [restaurant.id, restaurant.name]),
    );

    return grouped.map((group) => ({
      restaurantId: group.restaurantId,
      restaurantName:
        namesByRestaurantId.get(group.restaurantId) ?? 'Unknown Restaurant',
      outstandingServiceFee: Number((group._sum.serviceFee ?? 0).toFixed(2)),
      completedOrdersCount: group._count._all,
    }));
  }

  async collectOutstandingServiceFee(
    restaurantId: string,
  ): Promise<CollectOutstandingServiceFeeResponse> {
    const where = this.buildOutstandingServiceFeeWhere(restaurantId);

    const settlement = await this.prisma.$transaction(async (tx) => {
      const ordersToCollect = await tx.order.findMany({
        where,
        select: {
          id: true,
          serviceFee: true,
        },
      });

      if (ordersToCollect.length === 0) {
        return {
          collectedAmount: 0,
          ordersAffectedCount: 0,
        };
      }

      const collectedAmount = Number(
        ordersToCollect
          .reduce((sum, order) => sum + Number(order.serviceFee || 0), 0)
          .toFixed(2),
      );

      const orderIds = ordersToCollect.map((order) => order.id);
      const updateResult = await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          serviceFeeCollected: false,
        },
        data: {
          serviceFeeCollected: true,
        },
      });

      if (updateResult.count !== orderIds.length) {
        throw new ConflictException(
          'Service fee settlement changed concurrently. Retry the request.',
        );
      }

      return {
        collectedAmount,
        ordersAffectedCount: updateResult.count,
      };
    });

    return {
      restaurantId,
      ...settlement,
    };
  }

  async findOne(id: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: { select: { id: true, name: true } },
        student: { select: { id: true, email: true, name: true } },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Access control
    if (role === Role.STUDENT && order.studentId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (
      role === Role.RESTAURANT_ADMIN &&
      order.restaurantId !== (await this.getRestaurantIdForUser(userId))
    ) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  // Helper to get restaurant ID for a user (since verifyUser is generic)
  private async getRestaurantIdForUser(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { restaurantId: true },
    });
    return user?.restaurantId || null;
  }

  private buildOutstandingServiceFeeWhere(
    restaurantId?: string,
  ): Prisma.OrderWhereInput {
    return {
      status: OrderStatus.COMPLETED,
      serviceFeeCollected: false,
      serviceFee: {
        gt: 0,
      },
      paymentStatus: {
        not: PaymentStatus.REFUNDED,
      },
      refundStatus: {
        not: RefundStatus.REFUNDED,
      },
      ...(restaurantId ? { restaurantId } : {}),
    };
  }

  // Strict Status Transitions
  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    userId: string,
    role: Role,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        restaurantId: true,
        studentId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const newStatus = updateOrderStatusDto.status;
    const userRestaurantId = await this.getRestaurantIdForUser(userId);
    let expectedStatus: OrderStatus | null = null;
    const transitionData: {
      status: OrderStatus;
      readyAt?: Date;
      deliveredAt?: Date;
      completedAt?: Date;
    } = {
      status: newStatus,
    };

    // Authorization & Transition Logic
    if (role === Role.RESTAURANT_ADMIN) {
      if (order.restaurantId !== userRestaurantId) {
        throw new ForbiddenException('Access denied');
      }

      if (newStatus === OrderStatus.CANCELLED) {
        throw new BadRequestException(
          'Use /order/:id/cancel to cancel with a reason',
        );
      } else if (newStatus === OrderStatus.PREPARING) {
        expectedStatus = OrderStatus.RECEIVED;
      } else if (newStatus === OrderStatus.READY) {
        expectedStatus = OrderStatus.PREPARING;
        transitionData.readyAt = new Date();
      } else if (newStatus === OrderStatus.DELIVERED_TO_STUDENT) {
        expectedStatus = OrderStatus.READY;
        transitionData.deliveredAt = new Date();
      } else {
        throw new BadRequestException(
          `Invalid status transition from ${order.status} to ${newStatus} for Restaurant Admin`,
        );
      }
    } else if (role === Role.STUDENT) {
      if (order.studentId !== userId) {
        throw new ForbiddenException('Access denied');
      }

      if (newStatus === OrderStatus.COMPLETED) {
        expectedStatus = OrderStatus.DELIVERED_TO_STUDENT;
        transitionData.completedAt = new Date();
      } else {
        throw new BadRequestException(
          `Invalid status transition from ${order.status} to ${newStatus} for Student`,
        );
      }
    } else {
      throw new ForbiddenException('Role not authorized to update status');
    }

    if (!expectedStatus) {
      throw new BadRequestException('Invalid transition or already updated');
    }

    const updateResult = await this.prisma.order.updateMany({
      where: {
        id,
        status: expectedStatus,
      },
      data: transitionData,
    });

    if (updateResult.count === 0) {
      throw new BadRequestException('Invalid transition or already updated');
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        restaurantId: true,
        studentId: true,
        status: true,
      },
    });

    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }

    this.safeEmitOrderStatusChanged({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      restaurantId: updatedOrder.restaurantId,
      studentId: updatedOrder.studentId,
      status: updatedOrder.status,
    });

    if (updatedOrder.status === OrderStatus.READY) {
      await this.safeNotifyStudent(
        updatedOrder.studentId,
        NotificationType.ORDER_READY,
        `Order #${updatedOrder.orderNumber} is ready`,
        'Your order is ready for pickup.',
      );
    }

    return updatedOrder;
  }

  async cancelOrderByRestaurant(
    orderId: string,
    reasonType: CancellationReasonType,
    comment?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (reasonType === CancellationReasonType.SYSTEM_TIMEOUT) {
      throw new BadRequestException(
        'SYSTEM_TIMEOUT is reserved for internal automatic cancellation only',
      );
    }

    const normalizedComment = comment?.trim();
    if (reasonType === CancellationReasonType.OTHER && !normalizedComment) {
      throw new BadRequestException(
        'Comment is required when reasonType is OTHER',
      );
    }

    const refundStatus = RefundStatus.PENDING_MANUAL_REFUND;

    const allowedStatuses =
      reasonType === CancellationReasonType.INTERNAL_ISSUE
        ? [OrderStatus.RECEIVED, OrderStatus.PREPARING, OrderStatus.READY]
        : [OrderStatus.RECEIVED, OrderStatus.PREPARING];

    const updateResult = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: { in: allowedStatuses },
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReasonType: reasonType,
        cancellationComment: normalizedComment || undefined,
        cancelledAt: new Date(),
        cancelledByRole: Role.RESTAURANT_ADMIN,
        refundStatus,
      },
    });

    if (updateResult.count === 0) {
      const latest = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (
        latest?.status === OrderStatus.READY &&
        reasonType !== CancellationReasonType.INTERNAL_ISSUE
      ) {
        throw new BadRequestException(
          'Only INTERNAL_ISSUE cancellation is allowed when order is READY',
        );
      }

      throw new BadRequestException('Invalid transition or already updated');
    }

    const cancelledOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        restaurantId: true,
        studentId: true,
        status: true,
      },
    });

    if (!cancelledOrder) {
      throw new NotFoundException('Order not found');
    }

    this.safeEmitOrderStatusChanged({
      id: cancelledOrder.id,
      orderNumber: cancelledOrder.orderNumber,
      restaurantId: cancelledOrder.restaurantId,
      studentId: cancelledOrder.studentId,
      status: cancelledOrder.status,
    });

    await this.safeNotifyStudent(
      cancelledOrder.studentId,
      NotificationType.ORDER_CANCELLED,
      `Order #${cancelledOrder.orderNumber} cancelled`,
      'Your order was cancelled by the restaurant.',
    );

    return cancelledOrder;
  }

  private safeEmitOrderNew(order: {
    id: string;
    orderNumber: number;
    restaurantId: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
  }) {
    try {
      this.realtimeGateway.emitOrderNew(order.restaurantId, {
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit order:new for order ${order.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private safeEmitOrderStatusChanged(order: {
    id: string;
    orderNumber: number;
    restaurantId: string;
    studentId: string;
    status: OrderStatus;
  }) {
    try {
      this.realtimeGateway.emitOrderStatusChanged(
        order.restaurantId,
        order.studentId,
        {
          id: order.id,
          orderNumber: order.orderNumber,
          restaurantId: order.restaurantId,
          studentId: order.studentId,
          status: order.status,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit order:statusChanged for order ${order.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async safeNotifyStudent(
    studentId: string,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    try {
      await this.notificationService.createNotification(
        studentId,
        type,
        title,
        message,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create notification for student ${studentId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private resolveCardLast4(createOrderDto: CreateOrderDto): string | null {
    const sanitizedCardNumber = createOrderDto.cardNumber
      ?.replace(/[-\s]/g, '')
      .trim();
    const cardHolderName = createOrderDto.cardHolderName?.trim();
    const cvv = createOrderDto.cvv?.trim();

    if (!sanitizedCardNumber) {
      throw new BadRequestException(
        'cardNumber is required when paymentMethod is CARD',
      );
    }
    if (!/^\d{16}$/.test(sanitizedCardNumber)) {
      throw new BadRequestException('cardNumber must contain exactly 16 digits');
    }

    if (!cardHolderName) {
      throw new BadRequestException(
        'cardHolderName is required when paymentMethod is CARD',
      );
    }
    if (!/^[A-Za-z ]+$/.test(cardHolderName)) {
      throw new BadRequestException(
        'cardHolderName must contain only letters and spaces',
      );
    }

    if (
      typeof createOrderDto.expiryMonth !== 'number' ||
      !Number.isInteger(createOrderDto.expiryMonth) ||
      createOrderDto.expiryMonth < 1 ||
      createOrderDto.expiryMonth > 12
    ) {
      throw new BadRequestException(
        'expiryMonth must be an integer between 1 and 12',
      );
    }

    if (
      typeof createOrderDto.expiryYear !== 'number' ||
      !Number.isInteger(createOrderDto.expiryYear)
    ) {
      throw new BadRequestException('expiryYear is required when paymentMethod is CARD');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (createOrderDto.expiryYear < currentYear) {
      throw new BadRequestException(
        'expiryYear must be greater than or equal to the current year',
      );
    }
    if (
      createOrderDto.expiryYear === currentYear &&
      createOrderDto.expiryMonth < currentMonth
    ) {
      throw new BadRequestException(
        'expiryMonth must be greater than or equal to the current month',
      );
    }

    if (!cvv) {
      throw new BadRequestException('cvv is required when paymentMethod is CARD');
    }
    if (!/^\d{3}$/.test(cvv)) {
      throw new BadRequestException('cvv must contain exactly 3 digits');
    }

    return sanitizedCardNumber.slice(-4);
  }

  private parseTimeToMinutes(time?: string | null): number | null {
    if (!time) return null;

    const [hoursRaw, minutesRaw] = time.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  private isPastClosingTime(openTime?: string | null, closeTime?: string | null): boolean {
    const closeMinutes = this.parseTimeToMinutes(closeTime);
    if (closeMinutes === null) {
      return false;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = this.parseTimeToMinutes(openTime);

    if (openMinutes === null || openMinutes === closeMinutes) {
      return nowMinutes >= closeMinutes;
    }

    if (openMinutes < closeMinutes) {
      return nowMinutes >= closeMinutes;
    }

    return nowMinutes >= closeMinutes && nowMinutes < openMinutes;
  }
}
