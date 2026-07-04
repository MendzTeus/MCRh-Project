-- Migration 002 — Site content foundation
-- Two additive tables that let the admin edit everything beyond apartments:
--   SiteImage   — named image slots (home.hero, design.hero, about.hero, ...)
--   SiteContent — key→value store for text, numbers, links (jsonb value)
-- Safe to re-run. Does not touch existing tables.

CREATE TABLE IF NOT EXISTS "SiteImage" (
  "slot"         text PRIMARY KEY,          -- e.g. 'home.hero', 'design.approach'
  "url"          text NOT NULL,             -- Supabase Storage public URL
  "storagePath"  text,                      -- path inside the bucket (for deletes)
  "alt"          text,
  "updatedAt"    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "SiteContent" (
  "key"          text PRIMARY KEY,          -- e.g. 'home.hero.title', 'home.stats'
  "value"        jsonb NOT NULL,            -- string, number, or structured (arrays/objects)
  "updatedAt"    timestamp NOT NULL DEFAULT now()
);
