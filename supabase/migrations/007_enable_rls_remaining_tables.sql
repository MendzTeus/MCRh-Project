-- Phase 3 (RLS audit) fix: enable RLS on the 3 tables that were left disabled
-- when 004_enable_rls.sql was written (Property, Unit, BlockedDate).
--
-- No policies are added for anon/authenticated roles: the app has no Supabase
-- Auth usage and no anon-key client anywhere in the codebase (confirmed via
-- repo-wide grep in Phase 2, task 2.1/2.2) — the only DB client is the
-- server-side service-role client, which bypasses RLS entirely. Enabling RLS
-- with zero policies makes these tables deny-all for anon/authenticated,
-- closing the "fully exposed via PostgREST" gap flagged by the Supabase
-- security advisor, with zero behavior change for the actual app (admin
-- routes keep working via the service-role key).
--
-- If a future public-facing client (e.g. a mobile app using an anon key)
-- needs read access to these tables, add explicit SELECT policies then,
-- scoped to the same public columns server/content.js already allowlists.

ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlockedDate" ENABLE ROW LEVEL SECURITY;
