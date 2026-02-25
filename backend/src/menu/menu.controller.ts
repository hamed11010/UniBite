import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RestaurantOwnerGuard } from '../common/guards/restaurant-owner.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // Public endpoint - get menu for students (no stock numbers)
  @Get('restaurant/:restaurantId')
  async getPublicMenu(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getPublicMenu(restaurantId);
  }

  // Restaurant Admin - Categories
  @Post('category')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async createCategory(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.menuService.createCategory(req.restaurantId, createCategoryDto.name);
  }

  @Get('category')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async getCategories(@Request() req) {
    return this.menuService.getCategories(req.restaurantId);
  }

  @Put('category/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(
      id,
      req.restaurantId,
      updateCategoryDto.name || '',
    );
  }

  @Delete('category/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async deleteCategory(@Param('id') id: string, @Request() req) {
    return this.menuService.deleteCategory(id, req.restaurantId);
  }

  // Restaurant Admin - Products
  @Post('product')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async createProduct(@Request() req, @Body() createProductDto: CreateProductDto) {
    return this.menuService.createProduct(req.restaurantId, createProductDto);
  }

  @Get('product')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async getProducts(@Request() req, @Query('categoryId') categoryId?: string) {
    return this.menuService.getProducts(req.restaurantId, categoryId);
  }

  @Get('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async getProduct(@Param('id') id: string, @Request() req) {
    return this.menuService.getProduct(id, req.restaurantId);
  }

  @Put('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async updateProduct(
    @Param('id') id: string,
    @Request() req,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.menuService.updateProduct(id, req.restaurantId, updateProductDto);
  }

  @Delete('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  async deleteProduct(@Param('id') id: string, @Request() req) {
    return this.menuService.deleteProduct(id, req.restaurantId);
  }
}
