import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

@ValidatorConstraint({ name: 'CardExpiryNotPast', async: false })
class CardExpiryNotPastConstraint implements ValidatorConstraintInterface {
  validate(expiryYear: number, args: ValidationArguments) {
    const dto = args.object as CreateOrderDto;
    if (typeof expiryYear !== 'number' || typeof dto.expiryMonth !== 'number') {
      return true;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear) {
      return false;
    }

    if (expiryYear === currentYear && dto.expiryMonth < currentMonth) {
      return false;
    }

    return true;
  }

  defaultMessage() {
    return 'Card expiry date cannot be in the past';
  }
}

class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  sauces?: string[]; // IDs of selected sauces (ProductExtra)

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  addOns?: string[]; // IDs of selected add-ons (ProductExtra)
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(PaymentMethod)
  @IsIn([PaymentMethod.CARD], {
    message: 'paymentMethod must be CARD',
  })
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[-\s]/g, '') : value,
  )
  @Matches(/^\d{16}$/, {
    message: 'cardNumber must contain exactly 16 digits',
  })
  cardNumber?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[A-Za-z ]+$/, {
    message: 'cardHolderName must contain only letters and spaces',
  })
  cardHolderName?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth?: number;

  @Type(() => Number)
  @IsInt()
  @Min(new Date().getFullYear())
  @Validate(CardExpiryNotPastConstraint)
  expiryYear?: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}$/, {
    message: 'cvv must contain exactly 3 digits',
  })
  cvv?: string;
}
