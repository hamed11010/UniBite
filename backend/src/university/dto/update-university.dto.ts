import {
  IsString,
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class UpdateUniversityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  allowedEmailDomains?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
