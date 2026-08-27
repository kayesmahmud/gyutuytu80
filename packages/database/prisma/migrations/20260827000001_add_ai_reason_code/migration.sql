-- Seller-facing hold category chosen by the AI in the same moderation call
-- (stock_photo | unclear_photos | details_mismatch | suspicious_price |
--  duplicate | policy_check | other).
--
-- The raw ai_reason text stays editor-only; clients map this code to a
-- pre-written bilingual message on the seller's pending ad. Policy violations
-- (nudity / prohibited items) are always stored as the deliberately vague
-- 'policy_check' so the column never leaks what detection tripped.
ALTER TABLE ads
  ADD COLUMN ai_reason_code VARCHAR(30);
