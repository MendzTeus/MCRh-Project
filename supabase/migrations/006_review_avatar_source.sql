-- Adds a real reviewer avatar and a stable Airbnb review id to Review.
-- avatarUrl:      the reviewer's profile photo (muscache CDN) for trust/credibility.
-- sourceReviewId: Airbnb's data-review-id. UNIQUE so the same review can't be
--                 collected twice, and gives the admin a stable handle per review.
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "avatarUrl" text;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "sourceReviewId" text;

-- Partial unique index: enforce uniqueness only when a source id is present, so
-- manually-added reviews (no Airbnb id) can still coexist without collisions.
CREATE UNIQUE INDEX IF NOT EXISTS "review_source_id_unique"
  ON "Review" ("sourceReviewId")
  WHERE "sourceReviewId" IS NOT NULL;
