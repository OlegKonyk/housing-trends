import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email content (HTML)' })
  @IsString()
  html: string;

  @ApiProperty({ required: false, description: 'Plain text content' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ required: false, description: 'Related notification ID' })
  @IsOptional()
  @IsString()
  notificationId?: string;
}
