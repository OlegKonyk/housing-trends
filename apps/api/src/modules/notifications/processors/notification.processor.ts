import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../database/prisma.service';

@Processor('notifications')
@Injectable()
export class NotificationProcessor {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    const { notificationId } = job.data;

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });

    if (!notification || !notification.user) {
      console.error(`Notification ${notificationId} not found`);
      return;
    }

    // Send email notification
    await this.notificationsService.sendEmail({
      to: notification.user.email,
      subject: notification.subject,
      html: this.formatEmailHtml(notification),
      text: notification.content,
      notificationId: notification.id,
    });
  }

  @Process('process-scheduled-notifications')
  async handleScheduledNotifications(job: Job) {
    await this.notificationsService.processScheduledNotifications();
  }

  @Process('send-market-updates')
  async handleMarketUpdates(job: Job) {
    const { savedSearchId } = job.data;

    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
    });

    if (!savedSearch || !savedSearch.emailNotifications) {
      return;
    }

    await this.notificationsService.sendMarketUpdate(
      savedSearch.userId,
      savedSearch.id,
    );
  }

  @Process('send-price-alerts')
  async handlePriceAlerts(job: Job) {
    const { userId, countyId, priceData } = job.data;

    await this.notificationsService.sendPriceAlert(
      userId,
      countyId,
      priceData,
    );
  }

  private formatEmailHtml(notification: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Housing Trends Dashboard</h1>
          </div>
          <div class="content">
            <h2>${notification.subject}</h2>
            <div style="white-space: pre-wrap;">${notification.content}</div>
            <a href="${process.env.FRONTEND_URL}/dashboard/notifications/${notification.id}" class="button">
              View in Dashboard
            </a>
          </div>
          <div class="footer">
            <p>You received this email because you have notifications enabled.</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/settings/notifications">Manage notification preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
