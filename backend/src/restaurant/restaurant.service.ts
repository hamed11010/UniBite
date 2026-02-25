import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantSettingsDto } from './dto/update-restaurant-settings.dto';
import { Role, OrderStatus } from '@prisma/client';
import { ConfigService } from '../config/config.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async create(createRestaurantDto: CreateRestaurantDto) {
    const university = await this.prisma.university.findUnique({
      where: { id: createRestaurantDto.universityId },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    if (!university.isActive) {
      throw new BadRequestException('University is not active');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createRestaurantDto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException('Admin email already exists');
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: createRestaurantDto.name,
        universityId: createRestaurantDto.universityId,
        responsibleName: createRestaurantDto.responsibleName,
        responsiblePhone: createRestaurantDto.responsiblePhone,
      },
      select: {
        id: true,
        name: true,
        universityId: true,
        responsibleName: true,
        responsiblePhone: true,
        createdAt: true,
      },
    });

    const hashedPassword = await bcrypt.hash(
      createRestaurantDto.adminPassword,
      10,
    );

    const adminUser = await this.prisma.user.create({
      data: {
        email: createRestaurantDto.adminEmail,
        password: hashedPassword,
        role: Role.RESTAURANT_ADMIN,
        name: createRestaurantDto.responsibleName,
        phone: createRestaurantDto.responsiblePhone,
        language: 'en',
        universityId: createRestaurantDto.universityId,
        restaurantId: restaurant.id,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        language: true,
        universityId: true,
        restaurantId: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return {
      restaurant,
      admin: adminUser,
    };
  }

  async findAll() {
    return this.prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        universityId: true,
        isDisabled: true,
        disabledAt: true,
        responsibleName: true,
        responsiblePhone: true,
        createdAt: true,
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findByUniversity(universityId: string) {
    return this.prisma.restaurant.findMany({
      where: { universityId },
      select: {
        id: true,
        name: true,
        universityId: true,
        isDisabled: true,
        disabledAt: true,
        responsibleName: true,
        responsiblePhone: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        universityId: true,
        isDisabled: true,
        disabledAt: true,
        responsibleName: true,
        responsiblePhone: true,
        createdAt: true,
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async findPublicByUniversity(universityId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      select: { isActive: true },
    });

    if (!university?.isActive) {
      return [];
    }

    const config = await this.configService.getSettings();

    const restaurants = await this.prisma.restaurant.findMany({
      where: { universityId, isDisabled: false },
      select: {
        id: true,
        name: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        maxConcurrentOrders: true,
      },
    });

    const autoClosedIds = restaurants
      .filter(
        (restaurant) =>
          restaurant.isOpen &&
          this.isPastClosingTime(restaurant.openTime, restaurant.closeTime),
      )
      .map((restaurant) => restaurant.id);
    const autoClosedRestaurantIds = new Set(autoClosedIds);

    if (autoClosedIds.length > 0) {
      await this.prisma.restaurant.updateMany({
        where: {
          id: { in: autoClosedIds },
          isOpen: true,
        },
        data: { isOpen: false },
      });
    }

    const activeCandidateIds = restaurants
      .filter(
        (restaurant) =>
          !config.maintenanceMode &&
          !autoClosedRestaurantIds.has(restaurant.id) &&
          restaurant.isOpen &&
          restaurant.maxConcurrentOrders > 0,
      )
      .map((restaurant) => restaurant.id);

    const activeOrderCountByRestaurant = new Map<string, number>();
    if (activeCandidateIds.length > 0) {
      const groupedCounts = await this.prisma.order.groupBy({
        by: ['restaurantId'],
        where: {
          restaurantId: { in: activeCandidateIds },
          status: { in: [OrderStatus.RECEIVED, OrderStatus.PREPARING] },
        },
        _count: {
          _all: true,
        },
      });

      for (const grouped of groupedCounts) {
        activeOrderCountByRestaurant.set(grouped.restaurantId, grouped._count._all);
      }
    }

    return restaurants.map((restaurant) => {
      const isOpen =
        !config.maintenanceMode &&
        !autoClosedRestaurantIds.has(restaurant.id) &&
        restaurant.isOpen;

      const activeOrders = activeOrderCountByRestaurant.get(restaurant.id) ?? 0;
      const isBusy =
        isOpen &&
        restaurant.maxConcurrentOrders > 0 &&
        activeOrders >= restaurant.maxConcurrentOrders;

      return { ...restaurant, isOpen, isBusy };
    });
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

    // Overnight window (e.g., 20:00 -> 02:00)
    return nowMinutes >= closeMinutes && nowMinutes < openMinutes;
  }

  async autoCloseIfNeeded(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
      },
    });

    if (!restaurant || !restaurant.isOpen) return false;

    if (this.isPastClosingTime(restaurant.openTime, restaurant.closeTime)) {
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isOpen: false },
      });
      return true;
    }

    return false;
  }

  async openRestaurant(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        openTime: true,
        closeTime: true,
        isDisabled: true,
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

    if (!restaurant.openTime || !restaurant.closeTime) {
      throw new BadRequestException(
        'Opening and closing times must be set first',
      );
    }

    if (restaurant.isDisabled) {
      throw new ForbiddenException('Disabled restaurants cannot be opened');
    }

    if (!restaurant.university.isActive) {
      throw new ForbiddenException('Inactive universities cannot open restaurants');
    }

    const config = await this.configService.getSettings();
    if (config.maintenanceMode) {
      throw new ForbiddenException(
        'Cannot open restaurant while maintenance mode is active',
      );
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: true },
    });
  }

  async closeRestaurant(restaurantId: string) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: false },
    });
  }

  async findAutoDisabledRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        isDisabled: true,
        disabledAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        disabledAt: true,
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        reports: {
          select: {
            studentId: true,
            type: true,
            createdAt: true,
          },
        },
      },
      orderBy: { disabledAt: 'desc' },
    });

    return restaurants.flatMap((restaurant) => {
      if (!restaurant.disabledAt) {
        return [];
      }

      const windowStart = new Date(
        restaurant.disabledAt.getTime() - 2 * 60 * 60 * 1000,
      );
      const windowEnd = new Date(
        restaurant.disabledAt.getTime() + 5 * 60 * 1000,
      );

      const byType = new Map<string, Set<string>>();
      for (const report of restaurant.reports) {
        if (
          report.createdAt < windowStart ||
          report.createdAt > windowEnd
        ) {
          continue;
        }

        const existing = byType.get(report.type) ?? new Set<string>();
        existing.add(report.studentId);
        byType.set(report.type, existing);
      }

      let dominantType: string | null = null;
      let dominantCount = 0;
      for (const [type, students] of byType.entries()) {
        if (students.size > dominantCount) {
          dominantType = type;
          dominantCount = students.size;
        }
      }

      if (!dominantType || dominantCount < 3) {
        return [];
      }

      return [
        {
          id: restaurant.id,
          name: restaurant.name,
          disabledAt: restaurant.disabledAt,
          university: restaurant.university,
          reasonType: dominantType,
          uniqueStudents: dominantCount,
          reasonMessage: `Restaurant ${restaurant.name} automatically disabled due to multiple similar reports within short time.`,
        },
      ];
    });
  }

  async reEnableRestaurant(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        isDisabled: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (!restaurant.isDisabled) {
      throw new BadRequestException('Restaurant is already enabled');
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        isDisabled: false,
        disabledAt: null,
        isOpen: false,
      },
      select: {
        id: true,
        name: true,
        isOpen: true,
        isDisabled: true,
        disabledAt: true,
      },
    });
  }

  // --- Restaurant Admin Settings ---

  async getSettings(restaurantId: string) {
    await this.autoCloseIfNeeded(restaurantId);

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        maxConcurrentOrders: true,
        isDisabled: true,
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

    return {
      id: restaurant.id,
      name: restaurant.name,
      isOpen: restaurant.isOpen,
      openTime: restaurant.openTime,
      closeTime: restaurant.closeTime,
      maxConcurrentOrders: restaurant.maxConcurrentOrders,
      isDisabled: restaurant.isDisabled,
      isUniversityActive: restaurant.university.isActive,
    };
  }

  async updateSettings(
    restaurantId: string,
    dto: UpdateRestaurantSettingsDto,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        isDisabled: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
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

    if (dto.isOpen) {
      const nextOpenTime = dto.openTime ?? restaurant.openTime;
      const nextCloseTime = dto.closeTime ?? restaurant.closeTime;

      if (!nextOpenTime || !nextCloseTime) {
        throw new BadRequestException(
          'Opening and closing times must be set first',
        );
      }

      if (restaurant.isDisabled) {
        throw new ForbiddenException('Disabled restaurants cannot be opened');
      }

      if (!restaurant.university.isActive) {
        throw new ForbiddenException(
          'Inactive universities cannot open restaurants',
        );
      }

      const config = await this.configService.getSettings();
      if (config.maintenanceMode) {
        throw new ForbiddenException(
          'Cannot open restaurant while maintenance mode is active',
        );
      }
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.isOpen !== undefined && { isOpen: dto.isOpen }),
        ...(dto.openTime !== undefined && { openTime: dto.openTime }),
        ...(dto.closeTime !== undefined && { closeTime: dto.closeTime }),
        ...(dto.maxConcurrentOrders !== undefined && {
          maxConcurrentOrders: dto.maxConcurrentOrders,
        }),
      },
      select: {
        id: true,
        name: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        maxConcurrentOrders: true,
      },
    });
  }
}
