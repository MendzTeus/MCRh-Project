-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query)
ALTER TABLE "MediaAsset"
  ADD COLUMN IF NOT EXISTS "roomCategory" text;

COMMENT ON COLUMN "MediaAsset"."roomCategory" IS
  'Optional room/area label for Photo Tour grouping. Null = falls back to "Property" category.';
