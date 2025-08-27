import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { SearchFiltersDto } from './dto/search-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'Search housing data' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @UseGuards(OptionalAuthGuard)
  async search(
    @Body() filters: SearchFiltersDto,
    @CurrentUser() user?: any,
    @Req() req?: any,
  ) {
    // Add session info for tracking
    if (req) {
      filters.sessionId = req.sessionID || req.headers['x-session-id'];
      filters.ipAddress = req.ip;
      filters.userAgent = req.headers['user-agent'];
    }

    return this.searchService.searchHousingData(filters, user?.id);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved searches' })
  @ApiResponse({ status: 200, description: 'List of saved searches' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSavedSearches(@CurrentUser() user: any) {
    return this.searchService.getSavedSearches(user.id);
  }

  @Post('saved')
  @ApiOperation({ summary: 'Create a saved search' })
  @ApiResponse({ status: 201, description: 'Saved search created' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createSavedSearch(
    @CurrentUser() user: any,
    @Body() dto: CreateSavedSearchDto,
  ) {
    return this.searchService.createSavedSearch(user.id, dto);
  }

  @Get('saved/:id')
  @ApiOperation({ summary: 'Get a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search details' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSavedSearch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.searchService.getSavedSearch(id, user.id);
  }

  @Put('saved/:id')
  @ApiOperation({ summary: 'Update a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search updated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateSavedSearch(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    return this.searchService.updateSavedSearch(id, user.id, dto);
  }

  @Delete('saved/:id')
  @ApiOperation({ summary: 'Delete a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search deleted' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteSavedSearch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.searchService.deleteSavedSearch(id, user.id);
  }

  @Post('saved/:id/execute')
  @ApiOperation({ summary: 'Execute a saved search' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async executeSavedSearch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.searchService.executeSavedSearch(id, user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get search history' })
  @ApiResponse({ status: 200, description: 'Search history' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSearchHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getSearchHistory(user.id, limit);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular searches' })
  @ApiResponse({ status: 200, description: 'Popular searches' })
  async getPopularSearches(@Query('limit') limit?: number) {
    return this.searchService.getPopularSearches(limit);
  }

  @Get('counties/:id/similar')
  @ApiOperation({ summary: 'Get similar counties' })
  @ApiResponse({ status: 200, description: 'Similar counties' })
  async getSimilarCounties(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getSimilarCounties(id, limit);
  }
}
