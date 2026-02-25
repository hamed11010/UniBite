-- Add user profile and localization fields
ALTER TABLE "users"
ADD COLUMN "name" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
