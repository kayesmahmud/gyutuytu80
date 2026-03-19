-- Ad Views table (per-user view tracking for behavior notifications)
CREATE TABLE "ad_views" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "ad_id" INTEGER NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_views_pkey" PRIMARY KEY ("id")
);

-- Ad Price History table (for price drop notifications)
CREATE TABLE "ad_price_history" (
    "id" SERIAL NOT NULL,
    "ad_id" INTEGER NOT NULL,
    "old_price" DECIMAL(12,2) NOT NULL,
    "new_price" DECIMAL(12,2) NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_price_history_pkey" PRIMARY KEY ("id")
);

-- Indexes for ad_views
CREATE INDEX "idx_ad_views_ad_user" ON "ad_views"("ad_id", "user_id");
CREATE INDEX "idx_ad_views_user_date" ON "ad_views"("user_id", "created_at" DESC);
CREATE INDEX "idx_ad_views_ad_date" ON "ad_views"("ad_id", "created_at" DESC);

-- Index for ad_price_history
CREATE INDEX "idx_ad_price_history_ad" ON "ad_price_history"("ad_id");

-- Foreign keys
ALTER TABLE "ad_views" ADD CONSTRAINT "ad_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ad_views" ADD CONSTRAINT "ad_views_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_price_history" ADD CONSTRAINT "ad_price_history_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
