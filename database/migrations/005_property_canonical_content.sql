-- Phase 6: the Property row becomes the single source for a building's
-- headline, amenities, distances ("nearby") and specs. NULL = the site uses
-- the built-in value from src/data/properties.ts.
--
-- WHEN: BEFORE deploying the Phase 6 code. Both steps are harmless to the code
-- currently live (it doesn't read these columns).
-- Run each block separately in the Supabase SQL Editor. Safe to re-run.

-- 1) Backup of the table (backups are not confirmed on this project).
CREATE TABLE IF NOT EXISTS "Property_backup_005" AS SELECT * FROM "Property";
SELECT count(*) AS linhas_copiadas FROM "Property_backup_005";   -- expect 14

-- 2) New column for the "The Neighborhood" distances. Empty for now → the site
--    keeps using the built-in distances until someone edits them in the admin.
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "nearby" jsonb;

-- 3) Wood Street: the column still lists "Lift access", a snapshot from
--    2026-07-14. The code was corrected on 2026-07-29 (commit 1700bf7, "fix:
--    correct lift access by building"). NULL = use the corrected built-in list.
UPDATE "Property" SET amenities = NULL WHERE slug = 'wood-street';

-- 4) Check: wood-street amenities should now be NULL.
SELECT slug, amenities FROM "Property" WHERE slug = 'wood-street';

-- Undo (if ever needed):
--   UPDATE "Property" p SET amenities = b.amenities FROM "Property_backup_005" b
--   WHERE p.slug = b.slug AND p.slug = 'wood-street';
--   ALTER TABLE "Property" DROP COLUMN IF EXISTS "nearby";
-- After a few days with everything OK:  DROP TABLE "Property_backup_005";
--
-- Note: SiteContent rows "property.<slug>.*" (headline, amenities, nearby,
-- specs, quote…) are 2026-07-14 snapshots that nothing reads any more. They can
-- stay; they are listed by `npx tsx scripts/audit-static-vs-db.ts`.
