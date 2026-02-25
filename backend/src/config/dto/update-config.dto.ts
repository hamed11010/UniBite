import {
  IsBoolean,
  IsNumber,
  Max,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsBoolean()
  serviceFeeEnabled?: boolean;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  serviceFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  orderingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  maintenanceMessage?: string;
}
