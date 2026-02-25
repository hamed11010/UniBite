import { IsUUID } from 'class-validator';
import { BaseUserCredentialsDto } from '../../users/dto/base-user-credentials.dto';

export class SignupDto extends BaseUserCredentialsDto {
  @IsUUID()
  universityId: string;
}
