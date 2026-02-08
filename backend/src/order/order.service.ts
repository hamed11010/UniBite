import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(studentId: string, dto: CreateOrderDto) {
    const { restaurantId, items } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Validate restaurant
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Fetch products
    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        restaurantId,
      },
      include: {
        extras: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are invalid');
    }

    // Map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalPrice = 0;

    // Validate stock and compute total
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException('Invalid product in order');
      }

      // Stock / availability validation
      let isOutOfStock = product.manuallyOutOfStock;
      if (!isOutOfStock && product.hasStock) {
        if (
          product.stockQuantity !== null &&
          product.stockThreshold !== null
        ) {
          isOutOfStock = product.stockQuantity <= product.stockThreshold;
        }
      }

      if (isOutOfStock) {
        throw new BadRequestException(
          `Product "${product.name}" is out of stock`,
        );
      }

      // Extras validation and pricing
      const extras =
        item.selectedExtras && item.selectedExtras.length > 0
          ? product.extras.filter((e) => item.selectedExtras.includes(e.id))
          : [];

      if (
        item.selectedExtras &&
        extras.length !== item.selectedExtras.length
      ) {
        throw new BadRequestException(
          `Invalid extras selected for product "${product.name}"`,
        );
      }

      const extrasTotal = extras.reduce(
        (sum, e) => sum + (e.price || 0),
        0,
      );
      totalPrice += (product.price + extrasTotal) * item.quantity;
    }

    // Create order + items in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          studentId,
          restaurantId,
          totalPrice,
          status: OrderStatus.RECEIVED,
        },
      });

      await Promise.all(
        items.map(async (item) => {
          const product = productMap.get(item.productId)!;
          const extras =
            item.selectedExtras && item.selectedExtras.length > 0
              ? product.extras.filter((e) =>
                  item.selectedExtras.includes(e.id),
                )
              : [];
          const selectedExtraNames = extras.map((e) => e.name);

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              productName: product.name,
              unitPrice: product.price,
              quantity: item.quantity,
              selectedExtras: selectedExtraNames,
            },
          });
        }),
      );

      return order;
    });

    return this.getOrderForStudent(result.id, studentId);
  }

  async getOrdersForRestaurant(restaurantId: string) {
    return this.prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        student: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async updateOrderStatus(
    orderId: string,
    restaurantId: string,
    status: OrderStatus,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied to this order');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        student: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  async getOrderForStudent(orderId: string, studentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order || order.studentId !== studentId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}

