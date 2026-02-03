
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UniversityService } from '../university/university.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private universityService: UniversityService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    // Fetch and validate university
    let university;
    try {
      university = await this.universityService.findOne(signupDto.universityId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException('Invalid university selected');
      }
      throw error;
    }

    // Ensure university is active
    if (!university.isActive) {
      throw new BadRequestException('Selected university is not active');
    }

    // Validate email domain against university's allowed domains
    const emailDomain = `@${signupDto.email.split('@')[1]}`;
    if (!university.allowedEmailDomains.includes(emailDomain)) {
      throw new BadRequestException(
        `Email domain ${emailDomain} is not allowed for ${university.name}. Allowed domains: ${university.allowedEmailDomains.join(', ')}`,
      );
    }

    // Only students can sign up
    const user = await this.usersService.create(
      signupDto,
      Role.STUDENT,
      signupDto.universityId,
    );
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      universityId: user.universityId,
      isVerified: user.isVerified,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
