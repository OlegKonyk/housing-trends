import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { HousingController } from './housing.controller';
import { HousingService } from './housing.service';
import { HudApiService } from './services/hud-api.service';
import { CensusApiService } from './services/census-api.service';
import { FredApiService } from './services/fred-api.service';
import { DataSyncService } from './services/data-sync.service';
import { DataSyncProcessor } from './processors/data-sync.processor';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: 'data-sync',
    }),
  ],
  controllers: [HousingController],
  providers: [
    HousingService,
    HudApiService,
    CensusApiService,
    FredApiService,
    DataSyncService,
    DataSyncProcessor,
  ],
  exports: [HousingService],
})
export class HousingModule {}
