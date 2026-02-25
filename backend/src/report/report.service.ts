import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { NotificationType, ReportStatus, ReportType } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportService.name);
  private readonly escalationSweepIntervalMilliseconds = 60 * 1000;
  private escalationSweepHandle: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.escalateStaleResolvedReports();
    this.escalationSweepHandle = setInterval(() => {
      void this.escalateStaleResolvedReports();
    }, this.escalationSweepIntervalMilliseconds);
  }

  onModuleDestroy() {
    if (this.escalationSweepHandle) {
      clearInterval(this.escalationSweepHandle);
      this.escalationSweepHandle = null;
    }
  }

  // =========================
  // CREATE REPORT
  // =========================
  async create(studentId: string, dto: CreateReportDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // ---- Spam Rule A: Same order cannot be reported twice by same student
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: {
          id: true,
          studentId: true,
          restaurantId: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        order.studentId !== studentId ||
        order.restaurantId !== dto.restaurantId
      ) {
        throw new ForbiddenException(
          'You can only report your own order for this restaurant',
        );
      }

      const existingOrderReport = await this.prisma.report.findFirst({
        where: {
          studentId,
          orderId: dto.orderId,
        },
      });

      if (existingOrderReport) {
        throw new BadRequestException(
          'You already reported this order.',
        );
      }
    }

    // ---- Spam Rule B: Same restaurant cooldown (24h)
    const lastRestaurantReport = await this.prisma.report.findFirst({
      where: {
        studentId,
        restaurantId: dto.restaurantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastRestaurantReport) {
      const hoursSince =
        (Date.now() - lastRestaurantReport.createdAt.getTime()) /
        (1000 * 60 * 60);

      if (hoursSince < 24) {
        throw new BadRequestException(
          'You already submitted a report for this restaurant recently. Please wait before submitting another.',
        );
      }
    }

    const report = await this.prisma.report.create({
      data: {
        studentId,
        restaurantId: dto.restaurantId,
        orderId: dto.orderId,
        type: dto.type,
        comment: dto.comment,
      },
    });

    await this.checkThreeStrikeRule(dto.restaurantId, dto.type);

    return report;
  }

  // =========================
  // RESOLVE BY RESTAURANT
  // =========================
  async resolve(reportId: string, restaurantAdminRestaurantId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.restaurantId !== restaurantAdminRestaurantId) {
      throw new ForbiddenException('Access denied');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        `Invalid status transition from ${report.status} to ${ReportStatus.RESOLVED_BY_RESTAURANT}`,
      );
    }

    const resolvedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.RESOLVED_BY_RESTAURANT },
    });

    await this.safeNotifyStudentReportResolved(
      report.studentId,
      resolvedReport.id,
      report.type,
    );

    return resolvedReport;
  }

  // =========================
  // CONFIRM BY STUDENT
  // =========================
  async confirm(reportId: string, studentId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.studentId !== studentId) {
      throw new ForbiddenException('Access denied');
    }

    if (report.status !== ReportStatus.RESOLVED_BY_RESTAURANT) {
      throw new BadRequestException(
        `Invalid status transition from ${report.status} to ${ReportStatus.CONFIRMED_BY_STUDENT}`,
      );
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.CONFIRMED_BY_STUDENT },
    });
  }

  // =========================
  // FETCH FOR RESTAURANT
  // =========================
  async findByRestaurant(restaurantId: string) {
    return this.prisma.report.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // FETCH FOR SUPER ADMIN
  // =========================
  async findEscalatedForAdmin() {
    return this.prisma.report.findMany({
      where: {
        status: ReportStatus.ESCALATED,
      },
      select: {
        id: true,
        type: true,
        status: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // FETCH FOR STUDENT
  // =========================
  async findByStudent(studentId: string) {
    return this.prisma.report.findMany({
      where: { studentId },
      select: {
        id: true,
        type: true,
        status: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnhandledReportsForRestaurant(restaurantId: string) {
    // Restaurant-side queue should only include unresolved or escalated reports.
    const unhandledReports = await this.prisma.report.count({
      where: {
        restaurantId,
        status: { in: [ReportStatus.PENDING, ReportStatus.ESCALATED] },
      },
    });

    return { unhandledReports };
  }

  // =========================
  // 3 STRIKE RULE
  // =========================
  private async checkThreeStrikeRule(
    restaurantId: string,
    type: ReportType,
  ) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const recentReports = await this.prisma.report.findMany({
      where: {
        restaurantId,
        type,
        createdAt: { gte: twoHoursAgo },
      },
      select: { studentId: true },
    });

    const uniqueStudents = new Set(
      recentReports.map((r) => r.studentId),
    );

    if (uniqueStudents.size >= 3) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true,
          isDisabled: true,
        },
      });

      if (!restaurant) {
        return;
      }

      if (!restaurant.isDisabled) {
        const disabledAt = new Date();
        await this.prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            isOpen: false,
            isDisabled: true,
            disabledAt,
          },
        });

        this.logger.warn(
          `Restaurant "${restaurant.name}" auto-disabled after ${uniqueStudents.size} unique ${type} reports in 2 hours.`,
        );
      }

      const escalationResult = await this.prisma.report.updateMany({
        where: {
          restaurantId,
          type,
          createdAt: { gte: twoHoursAgo },
          status: {
            in: [
              ReportStatus.PENDING,
              ReportStatus.RESOLVED_BY_RESTAURANT,
            ],
          },
        },
        data: {
          status: ReportStatus.ESCALATED,
        },
      });

      if (escalationResult.count > 0) {
        await this.safeNotifySuperAdminsEscalation(
          `Escalation created for ${restaurant.name}`,
          `${escalationResult.count} report(s) were escalated for type ${type}.`,
        );
      }
    }
  }

  // =========================
  // AUTOMATIC ESCALATION (24H)
  // =========================
  private async escalateStaleResolvedReports() {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    );

    const result = await this.prisma.report.updateMany({
      where: {
        status: ReportStatus.RESOLVED_BY_RESTAURANT,
        updatedAt: { lte: twentyFourHoursAgo },
      },
      data: {
        status: ReportStatus.ESCALATED,
      },
    });

    if (result.count > 0) {
      this.logger.warn(
        `Escalated ${result.count} stale resolved report(s) after 24h without student confirmation.`,
      );
      await this.safeNotifySuperAdminsEscalation(
        'Stale report escalations created',
        `${result.count} stale resolved report(s) were escalated automatically.`,
      );
    }
  }

  private async safeNotifyStudentReportResolved(
    studentId: string,
    reportId: string,
    reportType: ReportType,
  ) {
    try {
      await this.notificationService.createNotification(
        studentId,
        NotificationType.REPORT_RESOLVED,
        `Report ${reportType} was resolved`,
        `Your report #${reportId} has been marked resolved by the restaurant.`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create report-resolved notification for student ${studentId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async safeNotifySuperAdminsEscalation(
    title: string,
    message: string,
  ) {
    try {
      await this.notificationService.notifySuperAdmins(
        NotificationType.ESCALATION_CREATED,
        title,
        message,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create escalation notification for super admins: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
