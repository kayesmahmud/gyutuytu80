-- Data fix: correct the province name typo "Koshi Provincee" -> "Koshi Province".
-- Only the display name is wrong in production; the slug ("koshi-province") is already
-- correct, so URLs/FKs are unaffected. Idempotent and narrowly scoped by id + old value,
-- so it's a no-op once applied or in environments that already have the correct name.
UPDATE locations
SET name = 'Koshi Province'
WHERE id = 1 AND name = 'Koshi Provincee';
