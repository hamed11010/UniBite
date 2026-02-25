import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  getMyProfile(@Req() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me/profile')
  updateMyProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/language')
  updateLanguage(@Req() req, @Body() dto: UpdateLanguageDto) {
    return this.usersService.updateLanguage(req.user.id, dto.language);
  }
}
