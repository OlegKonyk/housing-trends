import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { SearchFiltersDto } from './dto/search-filters.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchHousingData(filters: SearchFiltersDto, userId?: string) {
    const {
      states,
      counties,
      minPrice,
      maxPrice,
      minRent,
      maxRent,
      priceChangeMin,
      priceChangeMax,
      affordabilityIndex,
      dataType,
      sortBy,
      sortOrder,
      limit = 20,
      offset = 0,
    } = filters;

    // Save search history
    if (userId || filters) {
      await this.saveSearchHistory(userId, filters);
    }

    // Build query conditions
    const whereConditions: any = {};

    if (states && states.length > 0) {
      whereConditions.county = {
        stateCode: { in: states },
      };
    }

    if (counties && counties.length > 0) {
      whereConditions.county = {
        ...whereConditions.county,
        fipsCode: { in: counties },
      };
    }

    // Price filters for housing data
    const housingWhere: any = { ...whereConditions };
    if (minPrice) housingWhere.medianHomePrice = { gte: minPrice };
    if (maxPrice) housingWhere.medianHomePrice = { ...housingWhere.medianHomePrice, lte: maxPrice };
    if (priceChangeMin) housingWhere.priceChangeYoY = { gte: priceChangeMin };
    if (priceChangeMax) housingWhere.priceChangeYoY = { ...housingWhere.priceChangeYoY, lte: priceChangeMax };

    // Rent filters
    const rentWhere: any = { ...whereConditions };
    if (minRent) rentWhere.medianRent = { gte: minRent };
    if (maxRent) rentWhere.medianRent = { ...rentWhere.medianRent, lte: maxRent };

    // Fetch data based on type
    const results: any = {
      housing: [],
      rent: [],
      trends: [],
      counties: [],
    };

    if (!dataType || dataType === 'housing') {
      results.housing = await this.prisma.housingData.findMany({
        where: housingWhere,
        include: {
          county: true,
        },
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        take: limit,
        skip: offset,
      });
    }

    if (!dataType || dataType === 'rent') {
      results.rent = await this.prisma.rentData.findMany({
        where: rentWhere,
        include: {
          county: true,
        },
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        take: limit,
        skip: offset,
      });
    }

    if (!dataType || dataType === 'trends') {
      const trendsWhere: any = { ...whereConditions };
      if (affordabilityIndex) {
        trendsWhere.affordabilityIndex = { gte: affordabilityIndex };
      }

      results.trends = await this.prisma.marketTrend.findMany({
        where: trendsWhere,
        include: {
          county: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }

    // Get unique counties from results
    const countyIds = new Set<string>();
    [...results.housing, ...results.rent, ...results.trends].forEach((item) => {
      if (item?.countyId) countyIds.add(item.countyId);
    });

    if (countyIds.size > 0) {
      results.counties = await this.prisma.county.findMany({
        where: {
          id: { in: Array.from(countyIds) },
        },
      });
    }

    // Calculate aggregates
    const aggregates = await this.calculateAggregates(results);

    return {
      data: results,
      aggregates,
      pagination: {
        limit,
        offset,
        total: await this.countResults(whereConditions, dataType),
      },
    };
  }

  async createSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    const { name, description, filters, emailNotifications, notificationFrequency } = dto;

    // Validate filters
    this.validateSearchFilters(filters);

    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        userId,
        name,
        description,
        filters,
        emailNotifications,
        notificationFrequency,
      },
    });

    // Schedule initial notification if enabled
    if (emailNotifications) {
      await this.scheduleNotification(savedSearch.id);
    }

    return savedSearch;
  }

  async getSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSavedSearch(id: string, userId: string) {
    const savedSearch = await this.prisma.savedSearch.findFirst({
      where: { id, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    return savedSearch;
  }

  async updateSavedSearch(id: string, userId: string, dto: UpdateSavedSearchDto) {
    const savedSearch = await this.getSavedSearch(id, userId);

    if (dto.filters) {
      this.validateSearchFilters(dto.filters);
    }

    const updated = await this.prisma.savedSearch.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    // Update notification schedule if changed
    if (dto.emailNotifications !== undefined || dto.notificationFrequency) {
      await this.updateNotificationSchedule(id, updated);
    }

    return updated;
  }

  async deleteSavedSearch(id: string, userId: string) {
    await this.getSavedSearch(id, userId);

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return { message: 'Saved search deleted successfully' };
  }

  async executeSavedSearch(id: string, userId: string) {
    const savedSearch = await this.getSavedSearch(id, userId);
    const filters = savedSearch.filters as any;

    const results = await this.searchHousingData(filters, userId);

    // Update last executed timestamp
    await this.prisma.savedSearch.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return results;
  }

  async getSearchHistory(userId: string, limit = 10) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPopularSearches(limit = 10) {
    const searches = await this.prisma.searchHistory.groupBy({
      by: ['filters'],
      _count: {
        filters: true,
      },
      orderBy: {
        _count: {
          filters: 'desc',
        },
      },
      take: limit,
    });

    return searches.map((search) => ({
      filters: search.filters,
      count: search._count.filters,
    }));
  }

  async getSimilarCounties(countyId: string, limit = 5) {
    const county = await this.prisma.county.findUnique({
      where: { id: countyId },
      include: {
        housingData: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        rentData: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!county) {
      throw new NotFoundException('County not found');
    }

    // Find similar counties based on price range and state
    const priceRange = county.housingData[0]?.medianHomePrice || 0;
    const rentRange = county.rentData[0]?.medianRent || 0;

    const similarCounties = await this.prisma.county.findMany({
      where: {
        id: { not: countyId },
        OR: [
          { stateCode: county.stateCode },
          {
            housingData: {
              some: {
                medianHomePrice: {
                  gte: priceRange * 0.8,
                  lte: priceRange * 1.2,
                },
              },
            },
          },
          {
            rentData: {
              some: {
                medianRent: {
                  gte: rentRange * 0.8,
                  lte: rentRange * 1.2,
                },
              },
            },
          },
        ],
      },
      include: {
        housingData: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        rentData: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: limit,
    });

    return similarCounties;
  }

  private async saveSearchHistory(userId: string | undefined, filters: any) {
    try {
      await this.prisma.searchHistory.create({
        data: {
          userId,
          filters,
          resultsCount: 0, // Will be updated after search
          sessionId: filters.sessionId,
          ipAddress: filters.ipAddress,
          userAgent: filters.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't fail the search
      console.error('Failed to save search history:', error);
    }
  }

  private validateSearchFilters(filters: any) {
    if (!filters || typeof filters !== 'object') {
      throw new BadRequestException('Invalid search filters');
    }

    // Add specific validation rules as needed
    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      throw new BadRequestException('Minimum price cannot be greater than maximum price');
    }

    if (filters.minRent && filters.maxRent && filters.minRent > filters.maxRent) {
      throw new BadRequestException('Minimum rent cannot be greater than maximum rent');
    }
  }

  private buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any {
    const orderByMap: Record<string, any> = {
      price: { medianHomePrice: sortOrder },
      rent: { medianRent: sortOrder },
      priceChange: { priceChangeYoY: sortOrder },
      rentChange: { rentChangeYoY: sortOrder },
      date: { createdAt: sortOrder },
    };

    return orderByMap[sortBy || 'date'] || { createdAt: 'desc' };
  }

  private async countResults(whereConditions: any, dataType?: string): Promise<number> {
    let total = 0;

    if (!dataType || dataType === 'housing') {
      total += await this.prisma.housingData.count({ where: whereConditions });
    }

    if (!dataType || dataType === 'rent') {
      total += await this.prisma.rentData.count({ where: whereConditions });
    }

    if (!dataType || dataType === 'trends') {
      total += await this.prisma.marketTrend.count({ where: whereConditions });
    }

    return total;
  }

  private async calculateAggregates(results: any) {
    const housingPrices = results.housing.map((h: any) => h.medianHomePrice).filter(Boolean);
    const rentPrices = results.rent.map((r: any) => r.medianRent).filter(Boolean);

    return {
      avgHomePrice: housingPrices.length > 0
        ? housingPrices.reduce((a: number, b: number) => a + b, 0) / housingPrices.length
        : 0,
      avgRent: rentPrices.length > 0
        ? rentPrices.reduce((a: number, b: number) => a + b, 0) / rentPrices.length
        : 0,
      minHomePrice: housingPrices.length > 0 ? Math.min(...housingPrices) : 0,
      maxHomePrice: housingPrices.length > 0 ? Math.max(...housingPrices) : 0,
      minRent: rentPrices.length > 0 ? Math.min(...rentPrices) : 0,
      maxRent: rentPrices.length > 0 ? Math.max(...rentPrices) : 0,
      totalCounties: results.counties.length,
    };
  }

  private async scheduleNotification(savedSearchId: string) {
    // This will be implemented with the notification service
    console.log(`Scheduling notification for saved search: ${savedSearchId}`);
  }

  private async updateNotificationSchedule(savedSearchId: string, savedSearch: any) {
    // This will be implemented with the notification service
    console.log(`Updating notification schedule for saved search: ${savedSearchId}`);
  }
}
