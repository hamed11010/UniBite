-- CreateEnum
CREATE TYPE "PaymentMethod_new" AS ENUM ('CARD', 'COUNTER');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "cardLast4" TEXT;

-- Migrate existing payment method values and replace enum
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" DROP DEFAULT;

ALTER TABLE "orders"
ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
USING (
  CASE
    WHEN "paymentMethod"::text = 'DEMO' THEN 'COUNTER'
    ELSE "paymentMethod"::text
  END
)::"PaymentMethod_new";

ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'COUNTER';

DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
