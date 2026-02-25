import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async createCategory(restaurantId: string, name: string) {
    return this.prisma.category.create({
      data: {
        name,
        restaurantId,
      },
      select: {
        id: true,
        name: true,
        restaurantId: true,
        createdAt: true,
      },
    });
  }

  async getCategories(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      select: {
        id: true,
        name: true,
        restaurantId: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCategory(categoryId: string, restaurantId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied to this category');
    }

    return category;
  }

  async updateCategory(
    categoryId: string,
    restaurantId: string,
    name: string,
  ) {
    await this.getCategory(categoryId, restaurantId);

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { name },
      select: {
        id: true,
        name: true,
        restaurantId: true,
        createdAt: true,
      },
    });
  }

  async deleteCategory(categoryId: string, restaurantId: string) {
    await this.getCategory(categoryId, restaurantId);

    // Delete all products in this category (cascade will handle extras)
    await this.prisma.product.deleteMany({
      where: { categoryId },
    });

    return this.prisma.category.delete({
      where: { id: categoryId },
    });
  }

  // Products
  async createProduct(restaurantId: string, createProductDto: CreateProductDto) {
    // Verify category belongs to restaurant
    await this.getCategory(
      createProductDto.categoryId,
      restaurantId,
    );

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        price: createProductDto.price,
        description: createProductDto.description || null,
        hasStock: createProductDto.hasStock || false,
        stockQuantity: createProductDto.hasStock
          ? createProductDto.stockQuantity || null
          : null,
        stockThreshold: createProductDto.hasStock
          ? createProductDto.stockThreshold || null
          : null,
        manuallyOutOfStock: createProductDto.manuallyOutOfStock || false,
        categoryId: createProductDto.categoryId,
        restaurantId,
      },
    });

    // Create extras if provided
    if (createProductDto.extras && createProductDto.extras.length > 0) {
      await this.prisma.productExtra.createMany({
        data: createProductDto.extras.map((extra) => ({
          name: extra.name,
          price: extra.price || 0,
          productId: product.id,
        })),
      });
    }

    return this.getProduct(product.id, restaurantId);
  }

  async getProducts(restaurantId: string, categoryId?: string) {
    const where: Prisma.ProductWhereInput = categoryId
      ? { restaurantId, categoryId }
      : { restaurantId };

    return this.prisma.product.findMany({
      where,
      include: {
        extras: {
          select: {
            id: true,
            name: true,
            price: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getProduct(productId: string, restaurantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        extras: {
          select: {
            id: true,
            name: true,
            price: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.restaurantId !== restaurantId) {
      throw new ForbiddenException('Access denied to this product');
    }

    return product;
  }

  async updateProduct(
    productId: string,
    restaurantId: string,
    updateProductDto: UpdateProductDto,
  ) {
    await this.getProduct(productId, restaurantId);

    // If categoryId is being updated, verify new category belongs to restaurant
    if (updateProductDto.categoryId) {
      await this.getCategory(updateProductDto.categoryId, restaurantId);
    }

    const updateData: Prisma.ProductUncheckedUpdateInput = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name;
    }
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price;
    }
    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description || null;
    }
    if (updateProductDto.hasStock !== undefined) {
      updateData.hasStock = updateProductDto.hasStock;
      // If disabling stock tracking, clear stock fields
      if (!updateProductDto.hasStock) {
        updateData.stockQuantity = null;
        updateData.stockThreshold = null;
      }
    }
    if (updateProductDto.stockQuantity !== undefined) {
      updateData.stockQuantity = updateProductDto.hasStock
        ? updateProductDto.stockQuantity
        : null;
    }
    if (updateProductDto.stockThreshold !== undefined) {
      updateData.stockThreshold = updateProductDto.hasStock
        ? updateProductDto.stockThreshold
        : null;
    }
    if (updateProductDto.manuallyOutOfStock !== undefined) {
      updateData.manuallyOutOfStock = updateProductDto.manuallyOutOfStock;
    }
    if (updateProductDto.categoryId !== undefined) {
      updateData.categoryId = updateProductDto.categoryId;
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    // Handle extras update
    if (updateProductDto.extras !== undefined) {
      // Delete existing extras
      await this.prisma.productExtra.deleteMany({
        where: { productId },
      });

      // Create new extras
      if (updateProductDto.extras.length > 0) {
        await this.prisma.productExtra.createMany({
          data: updateProductDto.extras.map((extra) => ({
            name: extra.name as string,
            price: extra.price || 0,
            productId,
          })),
        });
      }
    }

    return this.getProduct(productId, restaurantId);
  }

  async deleteProduct(productId: string, restaurantId: string) {
    await this.getProduct(productId, restaurantId);

    // Delete extras first (cascade should handle this, but being explicit)
    await this.prisma.productExtra.deleteMany({
      where: { productId },
    });

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // Public menu for students (no stock numbers, only availability)
  async getPublicMenu(restaurantId: string) {
    const categories = await this.prisma.category.findMany({
      where: { restaurantId },
      include: {
        products: {
          include: {
            extras: {
              select: {
                id: true,
                name: true,
                price: true,
              },
              orderBy: {
                name: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to hide stock numbers and calculate availability
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      products: category.products.map((product) => {
        // Calculate if product is out of stock
        let isOutOfStock = product.manuallyOutOfStock;

        if (!isOutOfStock && product.hasStock) {
          if (
            product.stockQuantity !== null &&
            product.stockThreshold !== null
          ) {
            isOutOfStock = product.stockQuantity <= product.stockThreshold;
          }
        }

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          isOutOfStock,
          extras: product.extras,
        };
      }),
    }));
  }
}
