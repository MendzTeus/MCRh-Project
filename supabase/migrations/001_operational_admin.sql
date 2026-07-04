-- Migration 001 — Operational admin foundation
-- Additive only: extends Unit with editable/operational fields and adds a
-- MediaAsset table for photos. Safe to re-run (IF NOT EXISTS everywhere).
-- Does NOT touch Property / BlockedDate / Enquiry data.

-- ── Unit: operational/editable columns ──────────────────────────────
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "propertyName"  text;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "suppliedSpecs" text;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "postcode"      text;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "airbnbUrl"     text;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "squareFeet"    text;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "description"   text;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "displayOrder"  integer NOT NULL DEFAULT 0;
-- The hide/show switch for an apartment. true = shows on the public site.
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "visible"       boolean NOT NULL DEFAULT true;

-- ── MediaAsset: photos for a unit or a property ─────────────────────
CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id"            text PRIMARY KEY,
  "ownerType"     text NOT NULL CHECK ("ownerType" IN ('unit','property')),
  "ownerSlug"     text NOT NULL,            -- Unit.unitSlug or Property.slug
  "url"           text NOT NULL,            -- Supabase Storage public URL
  "storagePath"   text,                     -- path inside the bucket (for deletes)
  "alt"           text,
  "isPrimary"     boolean NOT NULL DEFAULT false,
  "displayOrder"  integer NOT NULL DEFAULT 0,
  "createdAt"     timestamp NOT NULL DEFAULT now(),
  "updatedAt"     timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "MediaAsset_owner_idx"
  ON "MediaAsset" ("ownerType", "ownerSlug", "displayOrder");

-- One unique index on unitSlug so seed upserts have a conflict target.
CREATE UNIQUE INDEX IF NOT EXISTS "Unit_unitSlug_key" ON "Unit" ("unitSlug");
