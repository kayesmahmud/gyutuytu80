-- Phase 2 AI autofill-from-photos: kill switch (off by default, flip deliberately).
-- Fail-open like moderation: off/missing key = the post-ad form behaves exactly as today.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('ai_autofill_enabled', 'false', 'boolean', 'Enable AI (DeepSeek) post-ad autofill from photos')
ON CONFLICT ("setting_key") DO NOTHING;
