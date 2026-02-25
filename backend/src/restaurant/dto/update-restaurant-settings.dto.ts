import { IsOptional, IsString, IsInt, Min, Matches, IsBoolean } from 'class-validator';

export class UpdateRestaurantSettingsDto {
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'openTime must be in HH:mm format' })
  openTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'closeTime must be in HH:mm format' })
  closeTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxConcurrentOrders?: number;
}
