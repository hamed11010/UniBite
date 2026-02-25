import { IsIn } from 'class-validator';

export class UpdateLanguageDto {
  @IsIn(['en', 'ar'])
  language: 'en' | 'ar';
}
