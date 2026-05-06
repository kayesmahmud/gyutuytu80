-- Verification pricing tiers (used when free toggle is OFF, or for "paid" card when free toggle is ON)
CREATE TABLE IF NOT EXISTS "verification_pricing" (
  "id" SERIAL PRIMARY KEY,
  "verification_type" VARCHAR(20) NOT NULL,
  "duration_days" INTEGER NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "discount_percentage" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP(6) DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) DEFAULT NOW(),
  CONSTRAINT "verification_pricing_verification_type_duration_days_key" UNIQUE ("verification_type", "duration_days")
);

CREATE INDEX IF NOT EXISTS "idx_verification_pricing_type" ON "verification_pricing" ("verification_type");

-- Verification campaigns (% discounts, mutually exclusive with free toggle)
CREATE TABLE IF NOT EXISTS "verification_campaigns" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "discount_percentage" INTEGER NOT NULL DEFAULT 0,
  "promo_code" VARCHAR(50),
  "banner_text" VARCHAR(255),
  "banner_emoji" VARCHAR(10) DEFAULT '🎉',
  "start_date" TIMESTAMP(6) NOT NULL,
  "end_date" TIMESTAMP(6) NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "applies_to_types" TEXT[] NOT NULL DEFAULT '{}',
  "min_duration_days" INTEGER,
  "max_uses" INTEGER,
  "current_uses" INTEGER DEFAULT 0,
  "created_by" INTEGER,
  "created_at" TIMESTAMP(6) DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) DEFAULT NOW(),
  CONSTRAINT "verification_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_verif_campaigns_active" ON "verification_campaigns" ("is_active", "start_date", "end_date");
CREATE INDEX IF NOT EXISTS "idx_verif_campaigns_code" ON "verification_campaigns" ("promo_code");

-- Free verification toggle (OFF by default; super admin enables when ready)
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('free_verification_enabled', 'false', 'boolean', 'Bypass payment gateway for first-time verifications (launch promo)'),
  ('free_verification_duration_days', '30', 'number', 'Free verification duration in days when toggle is on'),
  ('free_verification_types', '["individual","business"]', 'json', 'Verification types eligible for the free promo')
ON CONFLICT ("setting_key") DO NOTHING;

-- NOTE: verification_pricing is intentionally NOT seeded. Super admin sets prices
-- via /super-admin/verification-pricing UI before launching paid mode.
