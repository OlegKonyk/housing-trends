import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateSavedSearchDto {
  @ApiProperty({ description: 'Name of the saved search' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false, description: 'Description of the saved search' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Search filters to save' })
  @IsObject()
  filters: Record<string, any>;

  @ApiProperty({ required: false, description: 'Enable email notifications', default: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ 
    required: false, 
    enum: NotificationFrequency, 
    description: 'Frequency of notifications',
    default: NotificationFrequency.WEEKLY 
  })
  @IsOptional()
  @IsEnum(NotificationFrequency)
  notificationFrequency?: NotificationFrequency;
}
