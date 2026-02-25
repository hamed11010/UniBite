import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RestaurantOwnerGuard } from '../common/guards/restaurant-owner.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Req() req, @Body() dto: CreateReportDto) {
    return this.reportService.create(req.user.id, dto);
  }

  @Put(':id/resolve')
  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  resolve(@Param('id') id: string, @Req() req) {
    return this.reportService.resolve(
      id,
      req.user.restaurantId,
    );
  }

  @Put(':id/confirm')
  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  confirm(@Param('id') id: string, @Req() req) {
    return this.reportService.confirm(id, req.user.id);
  }

  @Get('restaurant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  getRestaurantReports(@Req() req) {
    return this.reportService.findByRestaurant(
      req.user.restaurantId,
    );
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  getStudentReports(@Req() req) {
    return this.reportService.findByStudent(req.user.id);
  }

  @Get('restaurant/:restaurantId/unhandled-count')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  countUnhandledReports(@Param('restaurantId') restaurantId: string) {
    return this.reportService.countUnhandledReportsForRestaurant(restaurantId);
  }

  @Get(['admin', 'escalated'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getEscalated() {
    return this.reportService.findEscalatedForAdmin();
  }
}
