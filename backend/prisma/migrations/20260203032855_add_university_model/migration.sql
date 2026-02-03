-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "universityId" TEXT;

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowedEmailDomains" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
