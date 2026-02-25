-- CreateTable
CREATE TABLE "global_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "serviceFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "serviceFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "orderingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_config_pkey" PRIMARY KEY ("id")
);
