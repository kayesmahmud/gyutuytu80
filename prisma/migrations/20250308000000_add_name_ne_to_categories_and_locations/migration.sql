-- AlterTable: Add name_ne column to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name_ne" VARCHAR(100);

-- AlterTable: Add name_ne column to locations
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "name_ne" VARCHAR(100);
