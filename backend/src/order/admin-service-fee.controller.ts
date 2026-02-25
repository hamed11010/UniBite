import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CollectServiceFeeDto } from './dto/collect-service-fee.dto';
import { OrderService } from './order.service';

@Controller('admin/service-fee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminServiceFeeController {
  constructor(private readonly orderService: OrderService) {}

  @Get('outstanding')
  getOutstandingServiceFee() {
    return this.orderService.getOutstandingServiceFeeByRestaurant();
  }

  @Post('collect')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  collectServiceFee(@Body() dto: CollectServiceFeeDto) {
    return this.orderService.collectOutstandingServiceFee(dto.restaurantId);
  }
}
