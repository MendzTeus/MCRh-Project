-- Rollback for 007_enable_rls_remaining_tables.sql
-- Restores Property, Unit, BlockedDate to their pre-migration (RLS disabled) state.

ALTER TABLE "Property" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Unit" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BlockedDate" DISABLE ROW LEVEL SECURITY;
