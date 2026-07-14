-- Enable RLS on tables created in Fase A
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent

ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteImage"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteContent" ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default, so admin routes (which use service key) are unaffected.
-- Public read for SiteContent and SiteImage (site needs to read them unauthenticated).
-- Postgres has no CREATE POLICY IF NOT EXISTS, so drop-then-create keeps this idempotent.
DROP POLICY IF EXISTS "public_read_site_content" ON "SiteContent";
CREATE POLICY "public_read_site_content"
  ON "SiteContent" FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_site_image" ON "SiteImage";
CREATE POLICY "public_read_site_image"
  ON "SiteImage" FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_media_asset" ON "MediaAsset";
CREATE POLICY "public_read_media_asset"
  ON "MediaAsset" FOR SELECT USING (true);
