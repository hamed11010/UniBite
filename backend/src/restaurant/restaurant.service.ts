import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createRestaurantDto: CreateRestaurantDto) {
    // Validate university exists
    const university = await this.prisma.university.findUnique({
      where: { id: createRestaurantDto.universityId },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    if (!university.isActive) {
      throw new BadRequestException('University is not active');
    }

    // Check if admin email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createRestaurantDto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException('Admin email already exists');
    }

    // Create restaurant
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

    // Create restaurant admin user
    const hashedPassword = await bcrypt.hash(createRestaurantDto.adminPassword, 10);

    const adminUser = await this.prisma.user.create({
      data: {
        email: createRestaurantDto.adminEmail,
        password: hashedPassword,
        role: Role.RESTAURANT_ADMIN,
        universityId: createRestaurantDto.universityId,
        restaurantId: restaurant.id,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
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
}
