-- Add display_order column to categories table
ALTER TABLE "categories" ADD COLUMN "display_order" INTEGER DEFAULT 999;

-- Set display order for parent categories (1-16)
UPDATE "categories" SET "display_order" = 1 WHERE "name" = 'Mobiles' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 2 WHERE "name" = 'Electronics' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 3 WHERE "name" = 'Vehicles' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 4 WHERE "name" = 'Property' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 5 WHERE "name" = 'Home & Living' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 6 WHERE "name" = 'Men''s Fashion & Grooming' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 7 WHERE "name" = 'Women''s Fashion & Beauty' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 8 WHERE "name" = 'Hobbies, Sports & Kids' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 9 WHERE "name" = 'Essentials' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 10 WHERE "name" = 'Jobs' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 11 WHERE "name" = 'Overseas Jobs' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 12 WHERE "name" = 'Pets & Animals' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 13 WHERE "name" = 'Services' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 14 WHERE "name" = 'Education' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 15 WHERE "name" = 'Business & Industry' AND "parent_id" IS NULL;
UPDATE "categories" SET "display_order" = 16 WHERE "name" = 'Agriculture' AND "parent_id" IS NULL;

-- Subcategories inherit parent's display_order (for consistent grouping)
-- They will be sorted alphabetically within each parent
