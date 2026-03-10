-- Add composite index for multi-filter ad listing queries
-- Covers the common pattern: status = 'approved' AND category IN (...) AND location IN (...) AND price BETWEEN x AND y
-- Column order: equality columns first (status, category_id, location_id), range column last (price)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ads_status_cat_loc_price"
  ON "ads" ("status", "category_id", "location_id", "price");
