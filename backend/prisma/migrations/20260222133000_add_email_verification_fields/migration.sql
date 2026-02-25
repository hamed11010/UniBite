-- AlterTable
ALTER TABLE "users"
ADD COLUMN "verificationCode" TEXT,
ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "verificationResendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "verificationResendWindow" TIMESTAMP(3);