-- AI moderation (Phase 1): DeepSeek first-pass screening of newly submitted ads.
-- The AI can only auto-publish or leave the ad pending ("held") — it never rejects;
-- humans remain the only "no".
--
-- ai_verdict:    'published' (AI was certain, ad went live instantly)
--                'held'      (any doubt — stays pending for human review, reason shown to editors)
--                'skipped'   (verified business direct-publish, never screened)
--                NULL        (not evaluated: feature off, over daily cap, or posted before this feature)
-- ai_reason:     short human-readable sentence from the model (or 'ai_unavailable' on API failure)
-- ai_checked_at: stamped ONLY when a DeepSeek API call was actually made —
--                the daily budget cap counts rows with ai_checked_at >= start of today.

ALTER TABLE "ads" ADD COLUMN "ai_verdict" VARCHAR(20);
ALTER TABLE "ads" ADD COLUMN "ai_reason" TEXT;
ALTER TABLE "ads" ADD COLUMN "ai_checked_at" TIMESTAMP(6);

-- Supports the per-post daily budget check: count of calls made today.
CREATE INDEX "idx_ads_ai_checked_at" ON "ads"("ai_checked_at");

-- Kill switch (off by default — flip to 'true' deliberately after watching verdicts)
-- and a hard daily budget on DeepSeek calls.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('ai_moderation_enabled', 'false', 'boolean', 'Enable AI (DeepSeek) first-pass ad moderation'),
  ('ai_moderation_daily_cap', '500', 'number', 'Max AI moderation API calls per day (0 disables)')
ON CONFLICT ("setting_key") DO NOTHING;
