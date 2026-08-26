-- Team inbox: shared "Thulo Bazaar Team" chat identity for editor→user outreach.

-- Which staff member actually wrote a team-account message (shown only in the editor panel)
ALTER TABLE "messages" ADD COLUMN "sent_by_user_id" INTEGER;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_fkey"
  FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Set only on team-inbox threads: the end user the thread belongs to.
-- UNIQUE, so each user has at most one team conversation (also closes the
-- duplicate-thread race that plain find-or-create allows).
ALTER TABLE "conversations" ADD COLUMN "team_user_id" INTEGER;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_team_user_id_fkey"
  FOREIGN KEY ("team_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE UNIQUE INDEX "uq_conversations_team_user" ON "conversations"("team_user_id");

-- Seed the shared sender account. The password_hash is not a valid bcrypt
-- string, so no credential can ever match it — the account cannot log in.
INSERT INTO "users" (email, password_hash, full_name, role, is_active, is_verified, email_verified)
SELECT 'team@thulobazaar.com.np', 'LOCKED:TEAM_ACCOUNT:NO_LOGIN', 'Thulo Bazaar Team', 'editor', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'team@thulobazaar.com.np');
