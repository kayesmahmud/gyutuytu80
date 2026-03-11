-- Add expires_at column to ads table for auto-expiry feature
ALTER TABLE "ads" ADD COLUMN "expires_at" TIMESTAMP(6);

-- Index for efficient expiry queries (cron job)
CREATE INDEX "idx_ads_expires_at" ON "ads" ("expires_at") WHERE "expires_at" IS NOT NULL AND "status" = 'approved';
