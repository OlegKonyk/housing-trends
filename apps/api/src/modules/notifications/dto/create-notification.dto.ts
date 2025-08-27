import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to send notification to' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Notification content' })
  @IsString()
  content: string;

  @ApiProperty({ required: false, description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
