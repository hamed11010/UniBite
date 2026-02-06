import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UniversityModule } from './university/university.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    UniversityModule,
    RestaurantModule,
    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
