import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UniversityService } from '../university/university.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { getRequiredEnv } from '../common/config/required-env';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly forgotPasswordMessage =
    'If this email exists, a reset link has been sent.';

  constructor(
    private usersService: UsersService,
    private universityService: UniversityService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
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

    const now = new Date();
    const code = this.generateVerificationCode();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
        verificationResendCount: 0,
        verificationResendWindow: now,
      },
    });

    try {
      await this.emailService.sendVerificationCode(user.email, code);
    } catch {
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      language: user.language,
      universityId: user.universityId,
      isVerified: user.isVerified,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, universityId } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🔐 University-based access control
    if (user.role !== Role.SUPER_ADMIN) {
      if (!universityId) {
        throw new BadRequestException('University selection is required');
      }

      if (!user.universityId || user.universityId !== universityId) {
        // Clear error message for restaurant admins
        if (user.role === Role.RESTAURANT_ADMIN) {
          throw new UnauthorizedException(
            'Account not associated with selected university',
          );
        }
        throw new UnauthorizedException(
          'Account not associated with selected university',
        );
      }
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
        name: user.name,
        phone: user.phone,
        language: user.language,
        universityId: user.universityId,
        restaurantId: user.restaurantId,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: this.forgotPasswordMessage };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const frontendBaseUrl = getRequiredEnv('FRONTEND_URL');
    const resetLink = `${frontendBaseUrl}/auth/reset-password?token=${rawToken}`;

    try {
      await this.emailService.sendPasswordReset(user.email, resetLink);
    } catch (error) {
      this.logger.warn(
        `Failed to send password reset email for user ${user.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    return { message: this.forgotPasswordMessage };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = this.hashToken(dto.token);
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const now = new Date();
    if (
      !user.verificationCode ||
      user.verificationCode !== dto.code ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt.getTime() < now.getTime()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        verificationResendCount: 0,
        verificationResendWindow: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationCode(dto: ResendVerificationDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const now = new Date();
    const oneHourMilliseconds = 60 * 60 * 1000;
    let resendCount = user.verificationResendCount ?? 0;
    let resendWindow = user.verificationResendWindow;

    if (
      !resendWindow ||
      now.getTime() - resendWindow.getTime() >= oneHourMilliseconds
    ) {
      resendCount = 0;
      resendWindow = now;
    }

    if (resendCount >= 5) {
      throw new BadRequestException(
        'Maximum resend attempts reached. Please try again later.',
      );
    }

    const code = this.generateVerificationCode();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
        verificationResendCount: resendCount + 1,
        verificationResendWindow: resendWindow,
      },
    });

    try {
      await this.emailService.sendVerificationCode(user.email, code);
    } catch {
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    return { message: 'Verification code resent successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    return {
      message: 'Password updated successfully',
    };
  }

  private generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashToken(rawToken: string) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
