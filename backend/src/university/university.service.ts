import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

@Injectable()
export class UniversityService {
  constructor(private prisma: PrismaService) {}

  async create(createUniversityDto: CreateUniversityDto) {
    // Validate email domains format
    const domains = createUniversityDto.allowedEmailDomains.map(domain => {
      const trimmed = domain.trim();
      if (!trimmed.startsWith('@')) {
        throw new BadRequestException(`Email domain must start with @: ${trimmed}`);
      }
      return trimmed;
    });

    return this.prisma.university.create({
      data: {
        name: createUniversityDto.name,
        allowedEmailDomains: domains,
      },
      select: {
        id: true,
        name: true,
        allowedEmailDomains: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    return this.prisma.university.findMany({
      where,
      select: {
        id: true,
        name: true,
        allowedEmailDomains: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findActive() {
    return this.prisma.university.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        allowedEmailDomains: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        allowedEmailDomains: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }

    return university;
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto) {
    await this.findOne(id); // Ensure university exists

    const updateData: any = {};

    if (updateUniversityDto.name !== undefined) {
      updateData.name = updateUniversityDto.name;
    }

    if (updateUniversityDto.allowedEmailDomains !== undefined) {
      // Validate email domains format
      const domains = updateUniversityDto.allowedEmailDomains.map(domain => {
        const trimmed = domain.trim();
        if (!trimmed.startsWith('@')) {
          throw new BadRequestException(`Email domain must start with @: ${trimmed}`);
        }
        return trimmed;
      });
      updateData.allowedEmailDomains = domains;
    }

    if (updateUniversityDto.isActive !== undefined) {
      updateData.isActive = updateUniversityDto.isActive;
    }

    return this.prisma.university.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        allowedEmailDomains: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async validateEmailDomain(universityId: string, email: string): Promise<boolean> {
    const university = await this.findOne(universityId);
    
    if (!university.isActive) {
      throw new BadRequestException('University is not active');
    }

    const emailDomain = `@${email.split('@')[1]}`;
    return university.allowedEmailDomains.includes(emailDomain);
  }
}
