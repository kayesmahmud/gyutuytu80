-- Pre-post AI check: warns the seller BEFORE submission when manually-typed
-- title/category mismatch or the title has a clear spelling mistake.
-- Kill switch, off by default — flip deliberately. Fail-open like moderation:
-- off/missing key = posting behaves exactly as today.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('ai_precheck_enabled', 'false', 'boolean', 'Enable AI pre-post check (category mismatch / spelling warnings before submit)')
ON CONFLICT ("setting_key") DO NOTHING;
