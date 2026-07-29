-- Canonical Property fields and rows for the eight internal buildings.
--
-- This repository has no Prisma schema; database changes are managed through
-- SQL migrations in supabase/migrations. The existing Property table already
-- owns name, area and description. These two columns complete the five-field
-- building content contract.

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "eyebrow" text,
  ADD COLUMN IF NOT EXISTS "neighborhoodTitle" text;

-- Property.name is NOT NULL and Property.id has no database default. Seed only
-- slugs confirmed in Unit.propertySlug, using the existing Unit.propertyName as
-- the temporary required name. Task 2 replaces it from the declared canonical
-- seed priority before any consumer is switched to Property.
WITH internal_buildings("slug") AS (
  VALUES
    ('crusader'),
    ('lockgate-mews'),
    ('loom-street'),
    ('mm2'),
    ('newton-street'),
    ('popworks'),
    ('sezas'),
    ('spinning-mills')
),
unit_names AS (
  SELECT
    u."propertySlug" AS "slug",
    min(NULLIF(btrim(u."propertyName"), '')) AS "name"
  FROM "Unit" u
  JOIN internal_buildings b ON b."slug" = u."propertySlug"
  GROUP BY u."propertySlug"
)
INSERT INTO "Property" (
  "id",
  "slug",
  "name",
  "description",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  n."slug",
  n."name",
  '',
  now(),
  now()
FROM unit_names n
WHERE n."name" IS NOT NULL
ON CONFLICT ("slug") DO NOTHING;
