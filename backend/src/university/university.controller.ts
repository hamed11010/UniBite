import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UniversityService } from './university.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('university')
export class UniversityController {
  constructor(private universityService: UniversityService) {}

  // Public endpoint - get active universities only
  @Get('active')
  async getActive() {
    return this.universityService.findActive();
  }

  // Super Admin only - create university
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() createUniversityDto: CreateUniversityDto) {
    return this.universityService.create(createUniversityDto);
  }

  // Super Admin only - list all universities (active + inactive)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.universityService.findAll(include);
  }

  // Super Admin only - get single university
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.universityService.findOne(id);
  }

  // Super Admin only - update university
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUniversityDto: UpdateUniversityDto,
  ) {
    return this.universityService.update(id, updateUniversityDto);
  }

  // Super Admin only - enable/disable university
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.universityService.update(id, { isActive });
  }
}
