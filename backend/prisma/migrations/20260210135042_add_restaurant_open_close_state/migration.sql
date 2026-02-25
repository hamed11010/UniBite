-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openTime" TEXT;
