-- Add missing CHECK constraints for data integrity
-- These complement the existing NOT NULL constraints

-- Prevent empty category names (categories.name already has NOT NULL)
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_not_empty" CHECK (trim(name) <> '');

-- Prevent empty file paths in ad_images (file_path already has NOT NULL)
ALTER TABLE "ad_images" ADD CONSTRAINT "ad_images_path_not_empty" CHECK (file_path <> '');
