import { IsOptional, IsArray, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DataType {
  HOUSING = 'housing',
  RENT = 'rent',
  TRENDS = 'trends',
}

export enum SortBy {
  PRICE = 'price',
  RENT = 'rent',
  PRICE_CHANGE = 'priceChange',
  RENT_CHANGE = 'rentChange',
  DATE = 'date',
}

export class SearchFiltersDto {
  @ApiProperty({ required: false, description: 'State codes to filter by' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[];

  @ApiProperty({ required: false, description: 'County FIPS codes to filter by' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  counties?: string[];

  @ApiProperty({ required: false, description: 'Minimum home price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false, description: 'Maximum home price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ required: false, description: 'Minimum rent price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRent?: number;

  @ApiProperty({ required: false, description: 'Maximum rent price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRent?: number;

  @ApiProperty({ required: false, description: 'Minimum price change YoY (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-100)
  @Max(100)
  priceChangeMin?: number;

  @ApiProperty({ required: false, description: 'Maximum price change YoY (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-100)
  @Max(100)
  priceChangeMax?: number;

  @ApiProperty({ required: false, description: 'Minimum affordability index' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  affordabilityIndex?: number;

  @ApiProperty({ required: false, enum: DataType, description: 'Type of data to search' })
  @IsOptional()
  @IsEnum(DataType)
  dataType?: DataType;

  @ApiProperty({ required: false, enum: SortBy, description: 'Sort by field' })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiProperty({ required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false, description: 'Number of results to return', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false, description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  // Internal fields for tracking
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}
