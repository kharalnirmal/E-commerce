ALTER TABLE "category" ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "product"
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "sku" TEXT;

UPDATE "product"
SET "sku" = 'CHK-' || UPPER(SUBSTRING(REGEXP_REPLACE("slug", '[^a-zA-Z0-9]', '', 'g'), 1, 16)) || '-' || UPPER(SUBSTRING(MD5("id"), 1, 4));

ALTER TABLE "product" ALTER COLUMN "sku" SET NOT NULL;
CREATE UNIQUE INDEX "product_sku_key" ON "product"("sku");

CREATE TABLE "product_image" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_image_productId_position_key" ON "product_image"("productId", "position");
CREATE INDEX "product_image_productId_idx" ON "product_image"("productId");
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "product_image" ("id", "productId", "url", "position", "createdAt", "updatedAt")
SELECT 'backfill-' || "id", "id", "imageUrl", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "product"
WHERE "imageUrl" IS NOT NULL;

CREATE TABLE "stock_adjustment" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "administratorId" TEXT,
  "actorLabel" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "resultingStock" INTEGER NOT NULL,
  "sequence" BIGSERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_adjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_adjustment_productId_createdAt_idx" ON "stock_adjustment"("productId", "createdAt");
CREATE INDEX "stock_adjustment_administratorId_idx" ON "stock_adjustment"("administratorId");
CREATE UNIQUE INDEX "stock_adjustment_sequence_key" ON "stock_adjustment"("sequence");
ALTER TABLE "stock_adjustment" ADD CONSTRAINT "stock_adjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_adjustment" ADD CONSTRAINT "stock_adjustment_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "stock_adjustment" ("id", "productId", "administratorId", "actorLabel", "delta", "reason", "resultingStock", "createdAt")
SELECT 'opening-' || product."id", product."id", NULL, 'System migration', product."stock", 'Migration opening balance', product."stock", CURRENT_TIMESTAMP
FROM "product" AS product
WHERE product."stock" <> 0;
