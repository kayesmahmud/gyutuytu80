-- AI screening of verification submissions (advisory: the AI never approves or
-- rejects; it records a verdict, tells the applicant what to fix, and editors decide).
ALTER TABLE "individual_verification_requests"
  ADD COLUMN "ai_verdict" VARCHAR(20),
  ADD COLUMN "ai_reason_code" VARCHAR(30),
  ADD COLUMN "ai_reason" TEXT,
  ADD COLUMN "ai_name_on_document" VARCHAR(255),
  ADD COLUMN "ai_checked_at" TIMESTAMP(6),
  ADD COLUMN "edited_at" TIMESTAMP(6);

ALTER TABLE "business_verification_requests"
  ADD COLUMN "ai_verdict" VARCHAR(20),
  ADD COLUMN "ai_reason_code" VARCHAR(30),
  ADD COLUMN "ai_reason" TEXT,
  ADD COLUMN "ai_name_on_document" VARCHAR(255),
  ADD COLUMN "ai_checked_at" TIMESTAMP(6),
  ADD COLUMN "edited_at" TIMESTAMP(6);

-- Kill switch. ON by default at the owner's request (2026-09-19); fail-open like
-- ad moderation: off/missing key = submissions behave exactly as before.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('ai_verification_screen_enabled', 'true', 'boolean', 'Enable AI (DeepSeek) screening of verification documents')
ON CONFLICT ("setting_key") DO NOTHING;
