-- Add editorial category fields as nullable so existing records can be backfilled.
ALTER TABLE "category"
ADD COLUMN "slug" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- The complete ID suffix guarantees uniqueness even when names normalize equally.
UPDATE "category"
SET "slug" = COALESCE(
  NULLIF(trim(BOTH '-' FROM regexp_replace(lower("name"), '[^[:alnum:]]+', '-', 'g')), ''),
  'category'
) || '-' || "id";

ALTER TABLE "category" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- Add editorial product fields as nullable so existing records remain valid.
ALTER TABLE "product"
ADD COLUMN "slug" TEXT,
ADD COLUMN "maker" TEXT,
ADD COLUMN "origin" TEXT,
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "product"
SET
  "slug" = COALESCE(
    NULLIF(trim(BOTH '-' FROM regexp_replace(lower("name"), '[^[:alnum:]]+', '-', 'g')), ''),
    'product'
  ) || '-' || "id",
  "maker" = 'Independent maker',
  "origin" = 'Nepal';

ALTER TABLE "product" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "product" ALTER COLUMN "maker" SET NOT NULL;
ALTER TABLE "product" ALTER COLUMN "origin" SET NOT NULL;
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");
