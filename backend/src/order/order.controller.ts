import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderByRestaurantDto } from './dto/cancel-order-by-restaurant.dto';
import { UpdateOrderPosDto } from './dto/update-order-pos.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';
import { RestaurantOwnerGuard } from '../common/guards/restaurant-owner.guard';

@Controller('order')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(Role.STUDENT)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(req.user.id, createOrderDto);
  }

  @Get('student')
  @Roles(Role.STUDENT)
  findAllByStudent(@Req() req) {
    return this.orderService.findAllByStudent(req.user.id);
  }

  @Get('restaurant/:restaurantId')
  @Roles(Role.RESTAURANT_ADMIN, Role.SUPER_ADMIN)
  @UseGuards(RestaurantOwnerGuard)
  async findAllByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Req() req,
    @Query('status') status?: OrderStatus,
    @Query('statuses') statuses?: string,
    @Query('search') search?: string,
    @Query('sinceHours') sinceHours?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    // Check if user owns this restaurant (only for RESTAURANT_ADMIN)
    if (req.user.role === Role.RESTAURANT_ADMIN && req.user.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    const parsedStatuses = this.parseStatuses(statuses);
    const parsedSinceHours = this.parseSinceHours(sinceHours);
    const parsedFrom = this.parseDate(from, 'from');
    const parsedTo = this.parseDate(to, 'to');
    const parsedPage = this.parsePositiveInt(page, 'page');
    const parsedPageSize = this.parsePositiveInt(pageSize, 'pageSize', 50);

    return this.orderService.findAllByRestaurant(restaurantId, {
      status,
      statuses: parsedStatuses,
      search,
      sinceHours: parsedSinceHours,
      from: parsedFrom,
      to: parsedTo,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  }

  @Get('admin')
  @Roles(Role.SUPER_ADMIN)
  async findAllForAdmin(
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: OrderStatus,
    @Query('statuses') statuses?: string,
    @Query('search') search?: string,
    @Query('sinceHours') sinceHours?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedStatuses = this.parseStatuses(statuses);
    const parsedSinceHours = this.parseSinceHours(sinceHours);
    const parsedFrom = this.parseDate(from, 'from');
    const parsedTo = this.parseDate(to, 'to');
    const parsedPage = this.parsePositiveInt(page, 'page') ?? 1;
    const parsedPageSize = this.parsePositiveInt(pageSize, 'pageSize', 50) ?? 10;

    return this.orderService.findAllForAdmin({
      restaurantId,
      status,
      statuses: parsedStatuses,
      search,
      sinceHours: parsedSinceHours,
      from: parsedFrom,
      to: parsedTo,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  }

  @Get('restaurant/:restaurantId/pending-count')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  countPendingOrders(@Param('restaurantId') restaurantId: string) {
    return this.orderService.countPendingOrdersForRestaurant(restaurantId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async cancelByRestaurant(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderByRestaurantDto,
    @Req() req,
  ) {
    // Reuse existing access-control path to guarantee restaurant ownership.
    await this.orderService.findOne(id, req.user.id, req.user.role);
    return this.orderService.cancelOrderByRestaurant(
      id,
      cancelOrderDto.reasonType,
      cancelOrderDto.comment,
    );
  }

  @Patch(':id/pos')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  updatePosOrderNumber(
    @Param('id') id: string,
    @Body() updateOrderPosDto: UpdateOrderPosDto,
    @Req() req,
  ) {
    return this.orderService.updatePosOrderNumber(
      id,
      req.user.id,
      req.user.role,
      updateOrderPosDto.posOrderNumber,
    );
  }

  @Get('service-fee-analytics')
  @Roles(Role.SUPER_ADMIN)
  getServiceFeeAnalytics() {
    return this.orderService.getServiceFeeAnalytics();
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.RESTAURANT_ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string, @Req() req) {
    return this.orderService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @Roles(Role.STUDENT, Role.RESTAURANT_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req,
  ) {
    return this.orderService.updateStatus(
      id,
      updateOrderStatusDto,
      req.user.id,
      req.user.role,
    );
  }

  private parseStatuses(statuses?: string): OrderStatus[] | undefined {
    if (!statuses) return undefined;

    const parsed = statuses
      .split(',')
      .map((status) => status.trim().toUpperCase())
      .filter((status) => status.length > 0);

    if (parsed.length === 0) {
      return undefined;
    }

    const validStatuses = new Set(Object.values(OrderStatus));
    const invalidStatus = parsed.find(
      (status) => !validStatuses.has(status as OrderStatus),
    );

    if (invalidStatus) {
      throw new BadRequestException(`Invalid order status: ${invalidStatus}`);
    }

    return Array.from(new Set(parsed)) as OrderStatus[];
  }

  private parseSinceHours(sinceHours?: string): number | undefined {
    if (!sinceHours) return undefined;

    const parsed = Number(sinceHours);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException('sinceHours must be a positive number');
    }

    return parsed;
  }

  private parsePositiveInt(
    value?: string,
    fieldName = 'value',
    maxValue?: number,
  ): number | undefined {
    if (!value) return undefined;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
    if (typeof maxValue === 'number' && parsed > maxValue) {
      throw new BadRequestException(
        `${fieldName} must be less than or equal to ${maxValue}`,
      );
    }

    return parsed;
  }

  private parseDate(value?: string, fieldName = 'date'): Date | undefined {
    if (!value) return undefined;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }

    return parsed;
  }
}
