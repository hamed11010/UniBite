import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductExtraDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;

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
  @IsNotEmpty()
  categoryId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductExtraDto)
  @IsOptional()
  extras?: CreateProductExtraDto[];
}
