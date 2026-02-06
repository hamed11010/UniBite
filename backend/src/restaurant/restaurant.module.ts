import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
