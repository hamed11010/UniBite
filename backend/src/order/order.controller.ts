import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RestaurantOwnerGuard } from '../common/guards/restaurant-owner.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Student - create order
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.id, dto);
  }

  // Restaurant admin - list orders for their restaurant
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async getRestaurantOrders(@Request() req) {
    return this.orderService.getOrdersForRestaurant(req.restaurantId);
  }

  // Restaurant admin - update order status
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(
      id,
      req.restaurantId,
      dto.status,
    );
  }

  // Student - get own order
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getOrder(@Param('id') id: string, @Request() req) {
    return this.orderService.getOrderForStudent(id, req.user.id);
  }
}

