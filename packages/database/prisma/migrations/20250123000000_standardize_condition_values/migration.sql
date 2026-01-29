-- Migration: Standardize condition values to "Brand New" or "Used"
--
-- This migration:
-- 1. Updates the default value from 'used' to 'Used'
-- 2. Normalizes existing data to only use "Brand New" or "Used"
--
-- NO DATA IS DELETED - only condition values are updated

-- 1. Change default value for condition column
ALTER TABLE "ads" ALTER COLUMN "condition" SET DEFAULT 'Used';

-- 2. Create backup table for safety
CREATE TABLE IF NOT EXISTS "_ads_condition_backup" AS
SELECT id, condition, updated_at FROM ads WHERE condition IS NOT NULL;

-- 3. Normalize "new" and "brand new" variants to "Brand New"
UPDATE "ads"
SET "condition" = 'Brand New', "updated_at" = NOW()
WHERE LOWER("condition") IN ('brand new', 'new');

-- 4. Normalize everything else (including NULL) to "Used"
UPDATE "ads"
SET "condition" = 'Used', "updated_at" = NOW()
WHERE "condition" IS NULL
   OR LOWER("condition") NOT IN ('brand new');
