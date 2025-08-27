import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HousingService } from './housing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { GetHousingDataDto } from './dto/get-housing-data.dto';
import { CountyDataDto } from './dto/county-data.dto';
import { MarketTrendsDto } from './dto/market-trends.dto';
import { DataSyncService } from './services/data-sync.service';

@ApiTags('housing')
@Controller('housing')
@UseInterceptors(CacheInterceptor)
export class HousingController {
  constructor(
    private readonly housingService: HousingService,
    private readonly dataSyncService: DataSyncService,
  ) {}

  @Get('counties')
  @ApiOperation({ summary: 'Get list of all counties' })
  @ApiResponse({ status: 200, description: 'List of counties' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state code' })
  @ApiQuery({ name: 'search', required: false, description: 'Search counties by name' })
  @Throttle(20, 60)
  async getCounties(
    @Query('state') state?: string,
    @Query('search') search?: string,
  ) {
    return this.housingService.getCounties({ state, search });
  }

  @Get('counties/:countyId')
  @ApiOperation({ summary: 'Get county details with latest data' })
  @ApiResponse({ status: 200, description: 'County details', type: CountyDataDto })
  @UseGuards(OptionalAuthGuard)
  async getCountyData(@Param('countyId') countyId: string) {
    return this.housingService.getCountyData(countyId);
  }

  @Get('data')
  @ApiOperation({ summary: 'Get housing data with filters' })
  @ApiResponse({ status: 200, description: 'Housing data' })
  @UseGuards(OptionalAuthGuard)
  async getHousingData(@Query() query: GetHousingDataDto) {
    return this.housingService.getHousingData(query);
  }

  @Get('rent')
  @ApiOperation({ summary: 'Get rent data for counties' })
  @ApiResponse({ status: 200, description: 'Rent data' })
  @UseGuards(OptionalAuthGuard)
  async getRentData(@Query() query: GetHousingDataDto) {
    return this.housingService.getRentData(query);
  }

  @Get('trends/:countyId')
  @ApiOperation({ summary: 'Get market trends for a county' })
  @ApiResponse({ status: 200, description: 'Market trends', type: MarketTrendsDto })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', '5y'], default: '1y' })
  @UseGuards(OptionalAuthGuard)
  async getMarketTrends(
    @Param('countyId') countyId: string,
    @Query('period') period: string = '1y',
  ) {
    return this.housingService.getMarketTrends(countyId, period);
  }

  @Get('affordability/:countyId')
  @ApiOperation({ summary: 'Calculate affordability metrics for a county' })
  @ApiResponse({ status: 200, description: 'Affordability metrics' })
  @ApiQuery({ name: 'income', required: false, type: Number })
  @UseGuards(OptionalAuthGuard)
  async getAffordabilityMetrics(
    @Param('countyId') countyId: string,
    @Query('income') income?: number,
  ) {
    return this.housingService.calculateAffordability(countyId, income);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare multiple counties' })
  @ApiResponse({ status: 200, description: 'Comparison data' })
  @ApiQuery({ name: 'countyIds', required: true, isArray: true })
  @UseGuards(OptionalAuthGuard)
  async compareCounties(@Query('countyIds') countyIds: string[]) {
    return this.housingService.compareCounties(countyIds);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Trigger data synchronization (Admin only)' })
  @ApiResponse({ status: 202, description: 'Sync job queued' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerDataSync(@Body() body: { source?: string }) {
    return this.dataSyncService.triggerSync(body.source);
  }

  @Get('sync/status')
  @ApiOperation({ summary: 'Get data sync status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sync status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSyncStatus() {
    return this.dataSyncService.getSyncStatus();
  }
}
