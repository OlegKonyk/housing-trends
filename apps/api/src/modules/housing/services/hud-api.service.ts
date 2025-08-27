import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HudApiService {
  private readonly logger = new Logger(HudApiService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get('externalApis.hud.apiUrl');
    this.apiKey = this.configService.get('externalApis.hud.apiKey');
  }

  async getFairMarketRents(state: string, year: number) {
    // TODO: Implement HUD API integration
    this.logger.log(`Fetching Fair Market Rents for ${state} in ${year}`);
    return [];
  }

  async getIncomeLimits(state: string, year: number) {
    // TODO: Implement HUD API integration
    this.logger.log(`Fetching Income Limits for ${state} in ${year}`);
    return [];
  }
}
