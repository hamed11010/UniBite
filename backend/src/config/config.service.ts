import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    // Ensure at least one config row exists
    let config = await this.prisma.globalConfig.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      config = await this.prisma.globalConfig.create({
        data: {
          id: 1,
          serviceFeeEnabled: false,
          serviceFeeAmount: 3.0,
        },
      });
    }

    return config;
  }

  async updateSettings(updateConfigDto: UpdateConfigDto) {
    // Ensure config exists first
    await this.getSettings();

    return this.prisma.globalConfig.update({
      where: { id: 1 },
      data: {
        ...updateConfigDto,
      },
    });
  }
}
