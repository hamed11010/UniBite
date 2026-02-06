import {
  IsString,
  IsEmail,
  IsUUID,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  responsibleName: string;

  @IsString()
  @IsNotEmpty()
  responsiblePhone: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;
}
