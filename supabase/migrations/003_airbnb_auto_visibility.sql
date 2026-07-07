-- Migration 003 — Airbnb auto-visibility
-- Adds an AUTOMATED listing flag, separate from the admin's manual `visible`
-- switch. A unit shows on the public site only when BOTH are true:
--   visible       = the admin's manual hide/show toggle (unchanged by automation)
--   airbnbListed  = whether the Airbnb page is live (set by the daily check job)
-- Keeping them apart means the daily check can never override a manual hide, and
-- a manual show can never resurrect a listing that Airbnb has unlisted.
-- Additive only; safe to re-run.

ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "airbnbListed"    boolean NOT NULL DEFAULT true;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "airbnbCheckedAt" timestamp;
