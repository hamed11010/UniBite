import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CancellationReasonType } from '@prisma/client';

export class CancelOrderByRestaurantDto {
  @IsEnum(CancellationReasonType)
  reasonType: CancellationReasonType;

  @ValidateIf(
    (dto: CancelOrderByRestaurantDto) =>
      dto.reasonType === CancellationReasonType.OTHER ||
      dto.comment !== undefined,
  )
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  comment?: string;
}
