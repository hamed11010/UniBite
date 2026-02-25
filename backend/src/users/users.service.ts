import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { OrderStatus, Role } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
    role: Role = Role.STUDENT,
    universityId?: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        role,
        name: createUserDto.name?.trim() || null,
        phone: createUserDto.phone?.trim() || null,
        language: createUserDto.language || 'en',
        universityId: universityId || null,
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
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
  }

  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true },
    });
  }

  async updateLanguage(userId: string, language: 'en' | 'ar') {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { language },
      select: { language: true },
    });

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedName = dto.name?.trim();
    const normalizedPhone = dto.phone?.trim();
    const normalizedResponsibleName = dto.responsibleName?.trim();
    const normalizedResponsiblePhone = dto.responsiblePhone?.trim();

    if (user.role === Role.STUDENT && !normalizedName && !user.name) {
      throw new BadRequestException('Name is required for student profile');
    }

    if (user.role === Role.RESTAURANT_ADMIN) {
      if (!user.restaurantId) {
        throw new BadRequestException('Restaurant admin account is not linked to a restaurant');
      }

      if (dto.responsibleName !== undefined && !normalizedResponsibleName) {
        throw new BadRequestException('Responsible name cannot be empty');
      }
      if (dto.responsiblePhone !== undefined && !normalizedResponsiblePhone) {
        throw new BadRequestException('Responsible phone cannot be empty');
      }

      await this.prisma.restaurant.update({
        where: { id: user.restaurantId },
        data: {
          ...(normalizedResponsibleName !== undefined && {
            responsibleName: normalizedResponsibleName,
          }),
          ...(normalizedResponsiblePhone !== undefined && {
            responsiblePhone: normalizedResponsiblePhone,
          }),
        },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(normalizedName !== undefined && { name: normalizedName || null }),
        ...(normalizedPhone !== undefined && { phone: normalizedPhone || null }),
      },
    });

    return this.getProfile(userId);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        language: true,
        createdAt: true,
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            responsibleName: true,
            responsiblePhone: true,
            university: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.STUDENT) {
      const topRestaurant = await this.prisma.order.groupBy({
        by: ['restaurantId'],
        where: { studentId: userId },
        _count: { _all: true },
        orderBy: {
          _count: {
            restaurantId: 'desc',
          },
        },
        take: 1,
      });

      let mostOrderedRestaurant: string | null = null;
      if (topRestaurant[0]?.restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: topRestaurant[0].restaurantId },
          select: { name: true },
        });
        mostOrderedRestaurant = restaurant?.name ?? null;
      }

      return {
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        joinedDate: user.createdAt,
        university: user.university,
        mostOrderedRestaurant,
      };
    }

    if (user.role === Role.RESTAURANT_ADMIN) {
      if (!user.restaurant?.id) {
        throw new BadRequestException('Restaurant admin account is not linked to a restaurant');
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [ordersToday, totalOrders, topProduct] = await Promise.all([
        this.prisma.order.count({
          where: {
            restaurantId: user.restaurant.id,
            createdAt: { gte: startOfDay },
          },
        }),
        this.prisma.order.count({
          where: {
            restaurantId: user.restaurant.id,
          },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              restaurantId: user.restaurant.id,
              status: {
                in: [
                  OrderStatus.READY,
                  OrderStatus.DELIVERED_TO_STUDENT,
                  OrderStatus.COMPLETED,
                ],
              },
            },
          },
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 1,
        }),
      ]);

      let mostSoldItem: string | null = null;
      if (topProduct[0]?.productId) {
        const product = await this.prisma.product.findUnique({
          where: { id: topProduct[0].productId },
          select: { name: true },
        });
        mostSoldItem = product?.name ?? null;
      }

      return {
        role: user.role,
        name: user.name || user.restaurant.responsibleName,
        email: user.email,
        phone: user.phone || user.restaurant.responsiblePhone,
        language: user.language,
        joinedDate: user.createdAt,
        restaurant: {
          id: user.restaurant.id,
          name: user.restaurant.name,
          responsibleName: user.restaurant.responsibleName,
          responsiblePhone: user.restaurant.responsiblePhone,
          university: user.restaurant.university,
        },
        analytics: {
          mostSoldItem,
          ordersToday,
          totalOrders,
        },
      };
    }

    return {
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      joinedDate: user.createdAt,
    };
  }
}
