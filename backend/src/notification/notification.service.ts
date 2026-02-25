import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        user: {
          select: {
            role: true,
            restaurantId: true,
          },
        },
      },
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.realtimeGateway.emitNotificationCreated(
      userId,
      notification.user.role,
      {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        unreadCount,
      },
      notification.user.restaurantId,
    );

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async notifySuperAdmins(type: NotificationType, title: string, message: string) {
    const superAdmins = await this.prisma.user.findMany({
      where: { role: Role.SUPER_ADMIN },
      select: { id: true, role: true, restaurantId: true },
    });

    if (superAdmins.length === 0) {
      return;
    }

    const userIds = superAdmins.map((admin) => admin.id);
    const createdAt = new Date();

    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        createdAt,
      })),
    });

    const [notifications, unreadCounts] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId: { in: userIds },
          type,
          title,
          message,
          createdAt,
        },
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          isRead: false,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const unreadCountByUserId = new Map(
      unreadCounts.map((entry) => [entry.userId, entry._count._all]),
    );
    const roleByUserId = new Map(
      superAdmins.map((admin) => [admin.id, admin.role]),
    );
    const restaurantIdByUserId = new Map(
      superAdmins.map((admin) => [admin.id, admin.restaurantId]),
    );

    for (const notification of notifications) {
      this.realtimeGateway.emitNotificationCreated(
        notification.userId,
        roleByUserId.get(notification.userId) ?? Role.SUPER_ADMIN,
        {
          ...notification,
          unreadCount: unreadCountByUserId.get(notification.userId) ?? 0,
        },
        restaurantIdByUserId.get(notification.userId),
      );
    }
  }
}
