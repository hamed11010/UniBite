-- CreateEnum
CREATE TYPE "CancellationReasonType" AS ENUM ('OUT_OF_STOCK', 'INTERNAL_ISSUE', 'BUSY', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING_MANUAL_REFUND', 'REFUNDED', 'NOT_REQUIRED');

-- CreateSequence
CREATE SEQUENCE "orders_orderNumber_seq";

-- AlterTable
ALTER TABLE "orders"
ADD COLUMN "orderNumber" INTEGER,
ADD COLUMN "cancellationReasonType" "CancellationReasonType",
ADD COLUMN "cancellationComment" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByRole" "Role",
ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE';

-- Configure order number autoincrement and backfill existing rows
ALTER SEQUENCE "orders_orderNumber_seq" OWNED BY "orders"."orderNumber";
ALTER TABLE "orders" ALTER COLUMN "orderNumber" SET DEFAULT nextval('"orders_orderNumber_seq"');
UPDATE "orders"
SET "orderNumber" = nextval('"orders_orderNumber_seq"')
WHERE "orderNumber" IS NULL;
SELECT setval(
  '"orders_orderNumber_seq"',
  COALESCE((SELECT MAX("orderNumber") FROM "orders"), 1),
  COALESCE((SELECT MAX("orderNumber") FROM "orders"), 0) > 0
);
ALTER TABLE "orders" ALTER COLUMN "orderNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
