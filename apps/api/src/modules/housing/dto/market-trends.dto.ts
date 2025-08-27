import { ApiProperty } from '@nestjs/swagger';

export class MarketTrendsDto {
  @ApiProperty()
  county: any;

  @ApiProperty()
  period: string;

  @ApiProperty({ type: [Object] })
  housingData: any[];

  @ApiProperty({ type: [Object] })
  rentData: any[];

  @ApiProperty({ type: [Object] })
  trends: any[];

  @ApiProperty({ required: false })
  summary?: {
    homePriceChange: {
      absolute: number;
      percentage: number;
    };
    rentChange: {
      absolute: number;
      percentage: number;
    };
  };
}
