import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductExtraDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  hasStock?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  stockThreshold?: number;

  @IsBoolean()
  @IsOptional()
  manuallyOutOfStock?: boolean;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductExtraDto)
  @IsOptional()
  extras?: UpdateProductExtraDto[];
}
