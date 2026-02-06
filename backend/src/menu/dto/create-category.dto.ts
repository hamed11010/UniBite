import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
