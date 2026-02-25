import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private assertConfigured() {
    if (!process.env.RESEND_API_KEY) {
      throw new InternalServerErrorException(
        'Email service is not configured',
      );
    }
  }

  async sendVerificationCode(email: string, code: string) {
    this.assertConfigured();

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your UniBite account',
      text: `Your verification code is: ${code}\nThis code expires in 10 minutes.`,
    });
  }

  async sendPasswordReset(email: string, resetLink: string) {
    this.assertConfigured();

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset your UniBite password',
      text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 15 minutes.`,
    });
  }
}
