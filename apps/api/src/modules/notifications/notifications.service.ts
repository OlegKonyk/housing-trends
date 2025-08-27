import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationType, NotificationFrequency, Prisma } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async createNotification(dto: CreateNotificationDto) {
    const { userId, type, subject, content, metadata } = dto;

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        subject,
        content,
        metadata,
      },
    });

    // Queue for sending
    await this.queueNotification(notification.id);

    return notification;
  }

  async getUserNotifications(userId: string, unreadOnly = false) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    await this.getNotification(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(id: string, userId: string) {
    await this.getNotification(id, userId);

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted' };
  }

  async sendPriceAlert(userId: string, countyId: string, priceData: any) {
    const county = await this.prisma.county.findUnique({
      where: { id: countyId },
    });

    if (!county) return;

    const subject = `Price Alert: ${county.name}, ${county.state}`;
    const content = this.formatPriceAlertContent(county, priceData);

    return this.createNotification({
      userId,
      type: NotificationType.PRICE_ALERT,
      subject,
      content,
      metadata: {
        countyId,
        priceData,
      },
    });
  }

  async sendMarketUpdate(userId: string, savedSearchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
      include: { user: true },
    });

    if (!savedSearch) return;

    // Get latest data based on saved search filters
    const marketData = await this.getMarketDataForSearch(savedSearch.filters);

    const subject = `Market Update: ${savedSearch.name}`;
    const content = this.formatMarketUpdateContent(savedSearch, marketData);

    const notification = await this.createNotification({
      userId,
      type: NotificationType.MARKET_UPDATE,
      subject,
      content,
      metadata: {
        savedSearchId,
        marketData,
      },
    });

    // Update last notified timestamp
    await this.prisma.savedSearch.update({
      where: { id: savedSearchId },
      data: { lastNotifiedAt: new Date() },
    });

    return notification;
  }

  async sendWelcomeEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const subject = 'Welcome to Housing Trends Dashboard!';
    const content = `
      Welcome ${user.name || 'there'}!
      
      We're excited to have you on board. Here's what you can do:
      - Search for housing and rent data across US counties
      - Save your favorite searches and get notified of changes
      - Compare different counties side by side
      - Track market trends over time
      
      Get started by exploring the dashboard!
    `;

    return this.createNotification({
      userId,
      type: NotificationType.WELCOME,
      subject,
      content,
      metadata: {},
    });
  }

  async processScheduledNotifications() {
    // Process daily notifications
    await this.processNotificationsByFrequency(NotificationFrequency.DAILY);

    // Process weekly notifications (only on Mondays)
    const today = new Date();
    if (today.getDay() === 1) {
      await this.processNotificationsByFrequency(NotificationFrequency.WEEKLY);
    }

    // Process monthly notifications (only on the 1st)
    if (today.getDate() === 1) {
      await this.processNotificationsByFrequency(NotificationFrequency.MONTHLY);
    }
  }

  private async processNotificationsByFrequency(frequency: NotificationFrequency) {
    const savedSearches = await this.prisma.savedSearch.findMany({
      where: {
        emailNotifications: true,
        notificationFrequency: frequency,
        OR: [
          { lastNotifiedAt: null },
          {
            lastNotifiedAt: {
              lt: this.getLastNotificationThreshold(frequency),
            },
          },
        ],
      },
    });

    for (const savedSearch of savedSearches) {
      await this.sendMarketUpdate(savedSearch.userId, savedSearch.id);
    }
  }

  private getLastNotificationThreshold(frequency: NotificationFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case NotificationFrequency.DAILY:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case NotificationFrequency.WEEKLY:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case NotificationFrequency.MONTHLY:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return now;
    }
  }

  private async queueNotification(notificationId: string) {
    await this.notificationQueue.add('send-notification', {
      notificationId,
    });
  }

  async sendEmail(dto: SendEmailDto) {
    // In production, integrate with SendGrid or AWS SES
    // For now, we'll just log the email
    console.log('Sending email:', dto);
    
    // Mark notification as sent
    if (dto.notificationId) {
      await this.prisma.notification.update({
        where: { id: dto.notificationId },
        data: {
          sent: true,
          sentAt: new Date(),
        },
      });
    }

    return { message: 'Email queued for sending' };
  }

  private formatPriceAlertContent(county: any, priceData: any): string {
    return `
      Housing market alert for ${county.name}, ${county.state}:
      
      Current median home price: $${priceData.medianHomePrice?.toLocaleString() || 'N/A'}
      Change from last month: ${priceData.priceChangeYoY || 0}%
      
      Current median rent: $${priceData.medianRent?.toLocaleString() || 'N/A'}
      Change from last month: ${priceData.rentChangeYoY || 0}%
      
      View more details on your dashboard.
    `;
  }

  private formatMarketUpdateContent(savedSearch: any, marketData: any): string {
    return `
      Market update for your saved search "${savedSearch.name}":
      
      ${marketData.summary || 'No significant changes detected.'}
      
      Counties with biggest price increases:
      ${marketData.topIncreases?.map((c: any) => `- ${c.name}: +${c.change}%`).join('\n') || 'None'}
      
      Counties with biggest price decreases:
      ${marketData.topDecreases?.map((c: any) => `- ${c.name}: ${c.change}%`).join('\n') || 'None'}
      
      View full details on your dashboard.
    `;
  }

  private async getMarketDataForSearch(filters: any): Promise<any> {
    // This would implement the logic to fetch and analyze market data
    // based on the saved search filters
    return {
      summary: 'Market conditions remain stable',
      topIncreases: [],
      topDecreases: [],
    };
  }

  async getNotificationStats(userId: string) {
    const [total, unread, byType] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
