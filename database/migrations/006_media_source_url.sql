-- Remembers which Airbnb photo each stored copy came from, so the admin can
-- tell imported photos from plain Airbnb links (and never import twice).
--
-- WHEN: before using "Importar fotos do Airbnb" in the admin. Additive and
-- harmless to the code currently live. Safe to re-run.
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "sourceUrl" text;

-- Check (should list sourceUrl):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'MediaAsset' AND column_name = 'sourceUrl';
