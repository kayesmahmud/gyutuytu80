-- Drop the legacy DEFAULT 'Used' on ads.condition.
--
-- Condition only applies to certain categories/subcategories (for-sale property,
-- electronics, vehicles, ...). For everything else (rentals, services, jobs, land,
-- ...) it must stay NULL so no "Used"/"Brand New" badge is shown. The old default
-- silently re-introduced a condition on any insert that didn't set the column
-- explicitly. Application code now always writes condition explicitly (NULL when
-- the ad has none), so the default is unnecessary and a foot-gun. Idempotent.
ALTER TABLE "ads" ALTER COLUMN "condition" DROP DEFAULT;
