import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateReportDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @IsString()
  @IsOptional()
  comment?: string;
}
