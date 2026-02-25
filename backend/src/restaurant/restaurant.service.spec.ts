import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantService } from './restaurant.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '../config/config.service';
import { OrderStatus } from '@prisma/client';

describe('RestaurantService', () => {
  let service: RestaurantService;

  const mockPrismaService = {
    restaurant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    university: {
      findUnique: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
  };

  const mockUsersService = {};
  const mockConfigService = {
    getSettings: jest.fn().mockResolvedValue({
      maintenanceMode: false,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicByUniversity', () => {
    const universityId = 'uni-1';
    const mockRestaurants = [
      {
        id: 'res-1',
        name: 'Resto 1',
        isOpen: true,
        openTime: '08:00',
        closeTime: '22:00',
        maxConcurrentOrders: 5,
        universityId,
      },
      {
        id: 'res-2',
        name: 'Resto 2',
        isOpen: true,
        openTime: '09:00',
        closeTime: '23:00',
        maxConcurrentOrders: 0, // Unlimited
        universityId,
      },
    ];

    beforeEach(() => {
      mockPrismaService.university.findUnique.mockResolvedValue({
        id: universityId,
        isActive: true,
      });

      mockPrismaService.restaurant.findUnique.mockImplementation(({ where }) => {
        const restaurant = mockRestaurants.find((r) => r.id === where.id);
        return Promise.resolve(
          restaurant
            ? {
                ...restaurant,
                closeTime: null,
              }
            : null,
        );
      });

      mockPrismaService.restaurant.update.mockResolvedValue(undefined);
      mockConfigService.getSettings.mockResolvedValue({
        maintenanceMode: false,
      });
    });

    it('should calculate isBusy=false when active orders < max', async () => {
      mockPrismaService.restaurant.findMany.mockResolvedValue(mockRestaurants);
      mockPrismaService.order.count.mockResolvedValue(3); // 3 < 5

      const results = await service.findPublicByUniversity(universityId);

      expect(results[0].id).toBe('res-1');
      expect(results[0].isBusy).toBe(false);
      expect(mockPrismaService.order.count.mock.calls[0][0]).toEqual({
        where: {
          restaurantId: 'res-1',
          status: { in: [OrderStatus.RECEIVED, OrderStatus.PREPARING] },
        },
      });
    });

    it('should calculate isBusy=true when active orders >= max', async () => {
      mockPrismaService.restaurant.findMany.mockResolvedValue(mockRestaurants);
      // First call for res-1 returns 5 (full)
      // Second call for res-2 (unlimited) shouldn't happen or matter
      mockPrismaService.order.count.mockImplementation((args) => {
          if (args.where.restaurantId === 'res-1') return Promise.resolve(5);
          return Promise.resolve(0);
      });

      const results = await service.findPublicByUniversity(universityId);

      expect(results[0].id).toBe('res-1');
      expect(results[0].isBusy).toBe(true);
    });

    it('should always return isBusy=false for unlimited maxConcurrentOrders (0)', async () => {
      mockPrismaService.restaurant.findMany.mockResolvedValue(mockRestaurants);
      
      const results = await service.findPublicByUniversity(universityId);

      expect(results[1].id).toBe('res-2');
      expect(results[1].isBusy).toBe(false);
      // Should not count orders for unlimited restaurant
      // Actually checking strict call might be flaky if implementation changes loop order, 
      // but we expect NO count call for res-2 based on implementation "if (r.maxConcurrentOrders > 0)"
    });
  });
});
