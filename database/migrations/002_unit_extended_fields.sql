-- Extended fields for the per-apartment admin editor.
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor).
ALTER TABLE "Unit"
  ADD COLUMN IF NOT EXISTS "maxGuests"        integer,
  ADD COLUMN IF NOT EXISTS "bedrooms"         integer,
  ADD COLUMN IF NOT EXISTS "beds"             integer,
  ADD COLUMN IF NOT EXISTS "bathrooms"        integer,
  ADD COLUMN IF NOT EXISTS "ensuiteBathrooms" integer,
  ADD COLUMN IF NOT EXISTS "wcCount"          integer,
  ADD COLUMN IF NOT EXISTS "floor"            integer,
  ADD COLUMN IF NOT EXISTS "hasLift"          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "displayTitle"     text,
  ADD COLUMN IF NOT EXISTS "seoTitle"         text,
  ADD COLUMN IF NOT EXISTS "metaDescription"  text,
  ADD COLUMN IF NOT EXISTS "internalNotes"    text,
  ADD COLUMN IF NOT EXISTS "latitude"         double precision,
  ADD COLUMN IF NOT EXISTS "longitude"        double precision;
