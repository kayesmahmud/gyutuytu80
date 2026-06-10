-- Data fix: add 2 municipalities missing from production so the locations table
-- matches the complete reference dataset (753 municipalities total).
--
-- "Sunkoshi Rural Municipality" exists in TWO districts in Nepal's administrative
-- geography, and both rows were absent in production:
--   id 10708 -> Okhaldhunga   (district 107, Koshi Province)
--   id 31211 -> Sindhupalchok (district 312, Bagmati Province)
--
-- Idempotent (ON CONFLICT DO NOTHING): safe to re-run and a no-op in environments
-- that already have these rows (e.g. local dev). slug/name_ne/lat/long stay NULL,
-- matching every other municipality row.
INSERT INTO locations (id, name, type, parent_id)
VALUES
  (10708, 'Sunkoshi Rural Municipality', 'municipality', 107),
  (31211, 'Sunkoshi Rural Municipality', 'municipality', 312)
ON CONFLICT (id) DO NOTHING;
