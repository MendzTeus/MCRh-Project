-- Add hidden flag to MediaAsset so individual photos can be excluded from the public Photo Tour.
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor).
ALTER TABLE "MediaAsset"
  ADD COLUMN IF NOT EXISTS "hidden" boolean DEFAULT false;
