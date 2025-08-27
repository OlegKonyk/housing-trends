import { ApiProperty } from '@nestjs/swagger';

export class CountyDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  stateCode: string;

  @ApiProperty()
  fipsCode: string;

  @ApiProperty({ required: false })
  population?: number;

  @ApiProperty({ required: false })
  medianIncome?: number;

  @ApiProperty({ required: false })
  currentHousingData?: any;

  @ApiProperty({ required: false })
  currentRentData?: any;

  @ApiProperty({ required: false })
  currentTrends?: any;
}
