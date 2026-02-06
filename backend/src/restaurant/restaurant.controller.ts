import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('restaurant')
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  // Super Admin only - create restaurant with admin
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.create(createRestaurantDto);
  }

  // Super Admin only - list all restaurants
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findAll() {
    return this.restaurantService.findAll();
  }

  // Super Admin only - get restaurants by university
  @Get('university/:universityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findByUniversity(@Param('universityId') universityId: string) {
    return this.restaurantService.findByUniversity(universityId);
  }

  // Super Admin only - get single restaurant
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }
}
