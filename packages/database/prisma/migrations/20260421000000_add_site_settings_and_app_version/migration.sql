-- CreateTable
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" SERIAL NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "setting_type" VARCHAR(50) DEFAULT 'string',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_setting_key_key" ON "site_settings"("setting_key");

-- Seed app version settings
INSERT INTO "site_settings" ("setting_key", "setting_value", "description")
VALUES
  ('app_latest_version', '1.0.0', 'Latest app version available in stores'),
  ('app_min_version', '1.0.0', 'Minimum required version (force update if below)'),
  ('app_grace_period_days', '7', 'Days of soft prompt before force update'),
  ('app_release_date', '2026-04-21', 'Date when latest version was released'),
  ('app_store_url_android', 'https://play.google.com/store/apps/details?id=com.thulobazaar.mobile', 'Play Store URL'),
  ('app_store_url_ios', '', 'App Store URL')
ON CONFLICT ("setting_key") DO NOTHING;
