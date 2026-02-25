import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { getRequiredEnv } from '../../common/config/required-env';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly prisma: PrismaService) {
    super({
      clientID:
        process.env.GOOGLE_CLIENT_ID || 'missing-google-client-id',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || 'missing-google-client-secret',
      callbackURL: getRequiredEnv('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account email is required');
    }

    const domainPart = email.split('@')[1]?.trim().toLowerCase();
    if (!domainPart) {
      throw new UnauthorizedException('Invalid Google account email');
    }

    const normalizedEmailDomain = `@${domainPart}`;
    const universities = await this.prisma.university.findMany({
      where: { isActive: true },
      select: {
        id: true,
        allowedEmailDomains: true,
      },
    });

    const matchedUniversity = universities.find((university) =>
      university.allowedEmailDomains.some(
        (domain) => domain.trim().toLowerCase() === normalizedEmailDomain,
      ),
    );

    if (!matchedUniversity) {
      throw new UnauthorizedException(
        'Email domain is not allowed for UniBite login',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (!existingUser.isVerified) {
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isVerified: true,
            verificationCode: null,
            verificationCodeExpiresAt: null,
            verificationResendCount: 0,
            verificationResendWindow: null,
          },
        });
      }

      return existingUser;
    }

    const oauthPassword = crypto.randomBytes(48).toString('hex');
    const hashedPassword = await bcrypt.hash(oauthPassword, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.STUDENT,
        name: profile.displayName?.trim() || null,
        universityId: matchedUniversity.id,
        isVerified: true,
      },
    });
  }
}
