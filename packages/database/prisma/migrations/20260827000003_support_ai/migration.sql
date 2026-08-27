-- AI support agent ("Thulo Bazaar Assistant"): first-line responder on support tickets.

-- Stamped when the AI hands a ticket over to the human team; once set, the AI
-- never speaks on that ticket again.
ALTER TABLE "support_tickets" ADD COLUMN "ai_escalated_at" TIMESTAMP(6);

-- Seed the assistant sender account. Same pattern as the team account
-- (20260826000001): the password_hash is not a valid bcrypt string, so no
-- credential can ever match it — the account cannot log in.
-- Named "AI Assistant" so every client honestly discloses the sender is AI.
INSERT INTO "users" (email, password_hash, full_name, role, is_active, is_verified, email_verified)
SELECT 'assistant@thulobazaar.com.np', 'LOCKED:SUPPORT_ASSISTANT:NO_LOGIN', 'Thulo Bazaar AI Assistant', 'editor', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'assistant@thulobazaar.com.np');

-- Kill switch (off by default) + daily reply budget.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('ai_support_enabled', 'false', 'boolean', 'Enable the AI support assistant (first-line replies on support tickets)'),
  ('ai_support_daily_cap', '300', 'number', 'Max AI support replies per day (0 disables the assistant)')
ON CONFLICT ("setting_key") DO NOTHING;
