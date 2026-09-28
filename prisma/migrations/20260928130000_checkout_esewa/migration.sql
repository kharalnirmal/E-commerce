ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'ABANDONED';

ALTER TABLE "orders"
  ADD COLUMN "displayNumber" TEXT,
  ADD COLUMN "subtotalAmount" DECIMAL(12,2),
  ADD COLUMN "deliveryFee" DECIMAL(12,2),
  ADD COLUMN "recipientName" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "district" TEXT,
  ADD COLUMN "municipality" TEXT,
  ADD COLUMN "ward" TEXT,
  ADD COLUMN "streetAddress" TEXT,
  ADD COLUMN "landmark" TEXT;

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM "createdAt") ORDER BY "createdAt", "id") AS number
  FROM "orders"
)
UPDATE "orders" AS orders
SET "displayNumber" = 'CHK-' || EXTRACT(YEAR FROM orders."createdAt")::INTEGER || '-' || LPAD(numbered.number::TEXT, 4, '0'),
    "subtotalAmount" = orders."totalAmount",
    "deliveryFee" = 0,
    "recipientName" = 'Legacy order',
    "phone" = '9800000000',
    "province" = 'Unknown',
    "district" = 'Unknown',
    "municipality" = 'Unknown',
    "ward" = '1',
    "streetAddress" = 'Unknown'
FROM numbered
WHERE numbered."id" = orders."id";

ALTER TABLE "orders"
  ALTER COLUMN "displayNumber" SET NOT NULL,
  ALTER COLUMN "subtotalAmount" SET NOT NULL,
  ALTER COLUMN "deliveryFee" SET NOT NULL,
  ALTER COLUMN "recipientName" SET NOT NULL,
  ALTER COLUMN "phone" SET NOT NULL,
  ALTER COLUMN "province" SET NOT NULL,
  ALTER COLUMN "district" SET NOT NULL,
  ALTER COLUMN "municipality" SET NOT NULL,
  ALTER COLUMN "ward" SET NOT NULL,
  ALTER COLUMN "streetAddress" SET NOT NULL;
CREATE UNIQUE INDEX "orders_displayNumber_key" ON "orders"("displayNumber");

ALTER TABLE "order_item"
  ADD COLUMN "cartItemId" TEXT,
  ADD COLUMN "productName" TEXT,
  ADD COLUMN "productSku" TEXT,
  ADD COLUMN "productMaker" TEXT,
  ADD COLUMN "productImageUrl" TEXT;
UPDATE "order_item" AS item
SET "cartItemId" = item."id", "productName" = product."name", "productSku" = product."sku", "productMaker" = product."maker", "productImageUrl" = product."imageUrl"
FROM "product" AS product WHERE product."id" = item."productId";
ALTER TABLE "order_item"
  ALTER COLUMN "cartItemId" SET NOT NULL,
  ALTER COLUMN "productName" SET NOT NULL,
  ALTER COLUMN "productSku" SET NOT NULL,
  ALTER COLUMN "productMaker" SET NOT NULL;

ALTER TABLE "payment"
  ADD COLUMN "attemptNumber" INTEGER,
  ADD COLUMN "gateway" TEXT NOT NULL DEFAULT 'ESEWA',
  ADD COLUMN "gatewayTransactionCode" TEXT,
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3);
WITH attempts AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "orderId" ORDER BY "createdAt", "id") AS number FROM "payment"
)
UPDATE "payment" AS payment
SET "attemptNumber" = attempts.number, "transactionId" = COALESCE(payment."transactionId", 'legacy-' || payment."id")
FROM attempts WHERE attempts."id" = payment."id";
ALTER TABLE "payment" ALTER COLUMN "attemptNumber" SET NOT NULL;
ALTER TABLE "payment" ALTER COLUMN "transactionId" SET NOT NULL;
CREATE UNIQUE INDEX "payment_orderId_attemptNumber_key" ON "payment"("orderId", "attemptNumber");

CREATE TABLE "inventory_reservation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "releasedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_reservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_reservation_paymentId_key" ON "inventory_reservation"("paymentId");
CREATE INDEX "inventory_reservation_orderId_idx" ON "inventory_reservation"("orderId");
CREATE INDEX "inventory_reservation_expiresAt_releasedAt_consumedAt_idx" ON "inventory_reservation"("expiresAt", "releasedAt", "consumedAt");

CREATE TABLE "inventory_reservation_item" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "inventory_reservation_item_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_reservation_item_reservationId_productId_key" ON "inventory_reservation_item"("reservationId", "productId");
CREATE INDEX "inventory_reservation_item_productId_idx" ON "inventory_reservation_item"("productId");

CREATE TABLE "order_timeline_event" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_timeline_event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "order_timeline_event_dedupeKey_key" ON "order_timeline_event"("dedupeKey");
CREATE INDEX "order_timeline_event_orderId_createdAt_idx" ON "order_timeline_event"("orderId", "createdAt");

CREATE TABLE "order_number_sequence" (
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_number_sequence_pkey" PRIMARY KEY ("year")
);
INSERT INTO "order_number_sequence" ("year", "lastValue", "updatedAt")
SELECT EXTRACT(YEAR FROM "createdAt")::INTEGER, COUNT(*), NOW() FROM "orders" GROUP BY EXTRACT(YEAR FROM "createdAt")
ON CONFLICT ("year") DO NOTHING;

ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation_item" ADD CONSTRAINT "inventory_reservation_item_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "inventory_reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation_item" ADD CONSTRAINT "inventory_reservation_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_timeline_event" ADD CONSTRAINT "order_timeline_event_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
