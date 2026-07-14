CREATE TABLE IF NOT EXISTS "Review" (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertySlug" text NOT NULL,
  name        text,
  date        text,
  text        text,
  rating      numeric DEFAULT 5,
  published   boolean DEFAULT true,
  "displayOrder" int DEFAULT 0,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_read_reviews"
  ON "Review" FOR SELECT USING (published = true);
