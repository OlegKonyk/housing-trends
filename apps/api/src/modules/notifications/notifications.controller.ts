import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.getUserNotifications(user.id, unreadOnly);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification stats' })
  async getNotificationStats(@CurrentUser() user: any) {
    return this.notificationsService.getNotificationStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification' })
  @ApiResponse({ status: 200, description: 'Notification details' })
  async getNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.getNotification(id, user.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.deleteNotification(id, user.id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test notification' })
  @ApiResponse({ status: 201, description: 'Test notification sent' })
  async sendTestNotification(@CurrentUser() user: any) {
    return this.notificationsService.createNotification({
      userId: user.id,
      type: 'SYSTEM' as any,
      subject: 'Test Notification',
      content: 'This is a test notification to verify the system is working correctly.',
      metadata: { test: true },
    });
  }
}
