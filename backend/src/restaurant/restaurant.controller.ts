import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantSettingsDto } from './dto/update-restaurant-settings.dto';
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

  // Public restaurants for students
  @Get('public/university/:universityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.SUPER_ADMIN)
  async getPublicRestaurantsByUniversity(
    @Param('universityId') universityId: string,
    @Req() req,
  ) {
    const user = req.user;

    // Students can ONLY access their own university
    if (user.role === Role.STUDENT && user.universityId !== universityId) {
      throw new ForbiddenException('Access denied');
    }

    return this.restaurantService.findPublicByUniversity(universityId);
  }

  // Restaurant Admin - get own settings
  @Get(':id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async getSettings(@Param('id') id: string, @Req() req) {
    if (req.user.restaurantId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.restaurantService.getSettings(id);
  }

  // Restaurant Admin - update settings
  @Put(':id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantSettingsDto,
    @Req() req,
  ) {
    if (req.user.restaurantId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.restaurantService.updateSettings(id, dto);
  }

  // Restaurant Admin - open restaurant
  @Put(':id/open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async openRestaurant(@Param('id') id: string, @Req() req) {
    if (req.user.restaurantId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.restaurantService.openRestaurant(id);
  }

  // Restaurant Admin - close restaurant
  @Put(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async closeRestaurant(@Param('id') id: string, @Req() req) {
    if (req.user.restaurantId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.restaurantService.closeRestaurant(id);
  }

  @Get('auto-disabled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findAutoDisabled() {
    return this.restaurantService.findAutoDisabledRestaurants();
  }

  @Patch(':id/re-enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async reEnableRestaurant(@Param('id') id: string) {
    return this.restaurantService.reEnableRestaurant(id);
  }

  // Super Admin only - get single restaurant (must be last `:id` route)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }
}
