import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { GetHousingDataDto } from './dto/get-housing-data.dto';

@Injectable()
export class HousingService {
  private readonly logger = new Logger(HousingService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getCounties(filters: { state?: string; search?: string }) {
    const where: Prisma.CountyWhereInput = {};

    if (filters.state) {
      where.stateCode = filters.state.toUpperCase();
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { state: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.county.findMany({
      where,
      select: {
        id: true,
        name: true,
        state: true,
        stateCode: true,
        fipsCode: true,
        population: true,
        medianIncome: true,
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });
  }

  async getCountyData(countyId: string) {
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
        marketTrends: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!county) {
      throw new NotFoundException('County not found');
    }

    return {
      ...county,
      currentHousingData: county.housingData[0] || null,
      currentRentData: county.rentData[0] || null,
      currentTrends: county.marketTrends[0] || null,
    };
  }

  async getHousingData(query: GetHousingDataDto) {
    const where: Prisma.HousingDataWhereInput = {};

    if (query.countyId) {
      where.countyId = query.countyId;
    }

    if (query.minPrice || query.maxPrice) {
      where.medianHomePrice = {
        gte: query.minPrice,
        lte: query.maxPrice,
      };
    }

    if (query.year) {
      where.year = query.year;
    }

    if (query.month) {
      where.month = query.month;
    }

    const [data, total] = await Promise.all([
      this.prisma.housingData.findMany({
        where,
        include: {
          county: {
            select: {
              id: true,
              name: true,
              state: true,
              stateCode: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.housingData.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getRentData(query: GetHousingDataDto) {
    const where: Prisma.RentDataWhereInput = {};

    if (query.countyId) {
      where.countyId = query.countyId;
    }

    if (query.minPrice || query.maxPrice) {
      where.medianRent = {
        gte: query.minPrice,
        lte: query.maxPrice,
      };
    }

    if (query.year) {
      where.year = query.year;
    }

    if (query.month) {
      where.month = query.month;
    }

    const [data, total] = await Promise.all([
      this.prisma.rentData.findMany({
        where,
        include: {
          county: {
            select: {
              id: true,
              name: true,
              state: true,
              stateCode: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.rentData.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getMarketTrends(countyId: string, period: string) {
    const county = await this.prisma.county.findUnique({
      where: { id: countyId },
    });

    if (!county) {
      throw new NotFoundException('County not found');
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '5y':
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      default:
        startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const [housingData, rentData, trends] = await Promise.all([
      this.prisma.housingData.findMany({
        where: {
          countyId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
      this.prisma.rentData.findMany({
        where: {
          countyId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
      this.prisma.marketTrend.findMany({
        where: {
          countyId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
    ]);

    return {
      county,
      period,
      housingData,
      rentData,
      trends,
      summary: this.calculateTrendSummary(housingData, rentData),
    };
  }

  async calculateAffordability(countyId: string, income?: number) {
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

    const annualIncome = income || county.medianIncome || 60000;
    const monthlyIncome = annualIncome / 12;

    const latestHousing = county.housingData[0];
    const latestRent = county.rentData[0];

    if (!latestHousing || !latestRent) {
      throw new NotFoundException('No housing data available for this county');
    }

    // Calculate affordability metrics
    const maxAffordableRent = monthlyIncome * 0.3; // 30% rule
    const maxAffordableHome = annualIncome * 3.5; // 3.5x income rule

    const rentAffordabilityRatio = latestRent.medianRent / monthlyIncome;
    const homeAffordabilityRatio = latestHousing.medianHomePrice / annualIncome;

    return {
      county: {
        id: county.id,
        name: county.name,
        state: county.state,
      },
      income: {
        annual: annualIncome,
        monthly: monthlyIncome,
      },
      currentPrices: {
        medianRent: latestRent.medianRent,
        medianHomePrice: latestHousing.medianHomePrice,
      },
      affordability: {
        maxAffordableRent,
        maxAffordableHome,
        rentAffordable: latestRent.medianRent <= maxAffordableRent,
        homeAffordable: latestHousing.medianHomePrice <= maxAffordableHome,
        rentToIncomeRatio: rentAffordabilityRatio,
        priceToIncomeRatio: homeAffordabilityRatio,
      },
      recommendations: this.getAffordabilityRecommendations(
        rentAffordabilityRatio,
        homeAffordabilityRatio,
      ),
    };
  }

  async compareCounties(countyIds: string[]) {
    if (countyIds.length > 5) {
      countyIds = countyIds.slice(0, 5); // Limit to 5 counties
    }

    const counties = await Promise.all(
      countyIds.map(id => this.getCountyData(id).catch(() => null)),
    );

    const validCounties = counties.filter(c => c !== null);

    if (validCounties.length === 0) {
      throw new NotFoundException('No valid counties found');
    }

    return {
      counties: validCounties,
      comparison: {
        lowestRent: this.findLowest(validCounties, 'currentRentData', 'medianRent'),
        highestRent: this.findHighest(validCounties, 'currentRentData', 'medianRent'),
        lowestHomePrice: this.findLowest(validCounties, 'currentHousingData', 'medianHomePrice'),
        highestHomePrice: this.findHighest(validCounties, 'currentHousingData', 'medianHomePrice'),
        bestAffordability: this.findBestAffordability(validCounties),
      },
    };
  }

  private calculateTrendSummary(housingData: any[], rentData: any[]) {
    if (housingData.length < 2 || rentData.length < 2) {
      return null;
    }

    const firstHousing = housingData[0];
    const lastHousing = housingData[housingData.length - 1];
    const firstRent = rentData[0];
    const lastRent = rentData[rentData.length - 1];

    return {
      homePriceChange: {
        absolute: lastHousing.medianHomePrice - firstHousing.medianHomePrice,
        percentage: ((lastHousing.medianHomePrice - firstHousing.medianHomePrice) / firstHousing.medianHomePrice) * 100,
      },
      rentChange: {
        absolute: lastRent.medianRent - firstRent.medianRent,
        percentage: ((lastRent.medianRent - firstRent.medianRent) / firstRent.medianRent) * 100,
      },
    };
  }

  private getAffordabilityRecommendations(rentRatio: number, homeRatio: number) {
    const recommendations = [];

    if (rentRatio <= 0.3) {
      recommendations.push('Rent is affordable based on your income');
    } else if (rentRatio <= 0.4) {
      recommendations.push('Rent is moderately high for your income');
    } else {
      recommendations.push('Rent exceeds recommended 30% of income');
    }

    if (homeRatio <= 3.5) {
      recommendations.push('Home prices are within affordable range');
    } else if (homeRatio <= 5) {
      recommendations.push('Home prices are moderately high for your income');
    } else {
      recommendations.push('Home prices significantly exceed affordable range');
    }

    return recommendations;
  }

  private findLowest(counties: any[], dataKey: string, field: string) {
    return counties.reduce((min, county) => {
      const value = county[dataKey]?.[field];
      const minValue = min[dataKey]?.[field];
      return value < minValue ? county : min;
    });
  }

  private findHighest(counties: any[], dataKey: string, field: string) {
    return counties.reduce((max, county) => {
      const value = county[dataKey]?.[field];
      const maxValue = max[dataKey]?.[field];
      return value > maxValue ? county : max;
    });
  }

  private findBestAffordability(counties: any[]) {
    return counties.reduce((best, county) => {
      const ratio = county.currentRentData?.medianRent / county.medianIncome * 12;
      const bestRatio = best.currentRentData?.medianRent / best.medianIncome * 12;
      return ratio < bestRatio ? county : best;
    });
  }
}
