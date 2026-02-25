import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminServiceFeeController } from './admin-service-fee.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module'; // For verifying user if needed
import { ConfigModule } from '../config/config.module';
import { NotificationModule } from '../notification/notification.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, UsersModule, ConfigModule, NotificationModule, RealtimeModule],
  controllers: [OrderController, AdminServiceFeeController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
