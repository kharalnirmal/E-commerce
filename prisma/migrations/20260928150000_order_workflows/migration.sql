ALTER TYPE "OrderStatus" ADD VALUE 'REFUND_PENDING';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

ALTER TABLE "payment"
ADD COLUMN "refundedAt" TIMESTAMP(3),
ADD COLUMN "refundedById" TEXT;

CREATE INDEX "payment_refundedById_idx" ON "payment"("refundedById");

ALTER TABLE "payment"
ADD CONSTRAINT "payment_refundedById_fkey"
FOREIGN KEY ("refundedById") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
