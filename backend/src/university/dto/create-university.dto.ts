import { IsString, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class CreateUniversityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedEmailDomains: string[];
}
