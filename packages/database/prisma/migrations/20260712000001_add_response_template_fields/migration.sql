-- Extend support_macros into full editor response templates:
-- bilingual (EN + NE), categorised, with global/private visibility and usage tracking.
-- Written idempotently (IF NOT EXISTS) so it is safe even if the columns were
-- applied out-of-band ahead of the deploy — `migrate deploy` then no-ops cleanly.
ALTER TABLE "support_macros" ADD COLUMN IF NOT EXISTS "title_ne" VARCHAR(100);
ALTER TABLE "support_macros" ADD COLUMN IF NOT EXISTS "content_ne" TEXT;
ALTER TABLE "support_macros" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) NOT NULL DEFAULT 'support';
ALTER TABLE "support_macros" ADD COLUMN IF NOT EXISTS "visibility" VARCHAR(20) NOT NULL DEFAULT 'private';
ALTER TABLE "support_macros" ADD COLUMN IF NOT EXISTS "usage_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "support_macros" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Visibility lookups (global vs private filtering)
CREATE INDEX IF NOT EXISTS "idx_support_macros_visibility" ON "support_macros"("visibility");
