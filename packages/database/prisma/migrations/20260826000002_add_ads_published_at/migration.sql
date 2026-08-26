-- published_at = first time the ad went live. Set once at first approval and
-- never bumped by re-approval (after owner edits), unsuspend, or restore.
-- Public feeds sort/display by this; reviewed_at keeps meaning "last
-- moderation action" for the editor panel and editor-productivity stats.
ALTER TABLE "ads" ADD COLUMN "published_at" TIMESTAMP(6);

CREATE INDEX "idx_ads_status_published" ON "ads"("status", "published_at" DESC);

-- Backfill: any ad that has ever been reviewed and is not currently rejected
-- was (or still is) live, and its reviewed_at still holds that go-live time —
-- owner edits never touch reviewed_at, so pending-after-edit ads keep it too.
-- Currently-rejected ads are excluded: their reviewed_at is the rejection
-- time, so a later approval should stamp a fresh publish time.
UPDATE "ads"
SET "published_at" = "reviewed_at"
WHERE "reviewed_at" IS NOT NULL
  AND ("status" IS NULL OR "status" <> 'rejected');
