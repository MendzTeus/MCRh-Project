-- One-time seed from Airbnb listing metadata verified on 2026-07-29.
-- Crusader and Lockgate Mews remain null because they are not currently listed.
BEGIN;

UPDATE "Unit" AS unit
SET
  "bedrooms" = verified."bedrooms",
  "bathrooms" = verified."bathrooms"
FROM (
  VALUES
    ('20-1-wsc', 1, 1),
    ('20-2-wsc', 1, 1),
    ('20-3-wsc', 1, 1),
    ('21-loft-conversion', 3, 1),
    ('22-4-wsc', 1, 1),
    ('22-5-wsc', 1, 1),
    ('22-6-wsc', 1, 1),
    ('ancoats-14', 2, 1),
    ('ancoats-15', 1, 1),
    ('ancoats-pop-5', 2, 2),
    ('chambers-11-1', 1, 1),
    ('chambers-11-1-11-2', 3, 3),
    ('chambers-11-2', 2, 2),
    ('chambers-11-3', 1, 1),
    ('chambers-11-4', 2, 2),
    ('chambers-11-5', 3, 2),
    ('chambers-7-9', 4, 3),
    ('chambers-9-1', 2, 2),
    ('chambers-9-1-9-2', 5, 4),
    ('chambers-9-2', 3, 2),
    ('chambers-9-7', 2, 1),
    ('chambers-9-8', 2, 1),
    ('chambers-9-9', 2, 2),
    ('jds-1', 1, 1),
    ('jds-1-2', 3, 3),
    ('jds-2', 2, 2),
    ('jds-3', 2, 2),
    ('jds-3-4', 4, 3),
    ('jds-4', 2, 1),
    ('mill-conversion-3', 2, 1),
    ('mill-conversion-8', 2, 1),
    ('oldtraford', 2, 1),
    ('redbrick-mill-2', 2, 2),
    ('redbrick-mill-4', 1, 1),
    ('sezas-conversion', 2, 1),
    ('wood-st-2', 2, 3),
    ('wood-st-3', 3, 3),
    ('wood-street-collective-full-house', 6, 6)
) AS verified("unitSlug", "bedrooms", "bathrooms")
WHERE unit."unitSlug" = verified."unitSlug";

UPDATE "Unit"
SET
  "airbnbUrl" = 'https://airbnb.co.uk/h/6br-mission-house',
  "airbnbListed" = true
WHERE "unitSlug" = 'wood-street-collective-full-house';

UPDATE "Unit"
SET "airbnbListed" = false
WHERE "unitSlug" IN ('mill-conversion-6', 'lockgate-504');

-- Keep the existing public rendering priority and correct the two stale/missing
-- suppliedSpecs values found during the live Airbnb comparison.
UPDATE "Unit"
SET "suppliedSpecs" = '3 Bedrooms 3 Bathrooms'
WHERE "unitSlug" = 'chambers-11-1-11-2';

UPDATE "Unit"
SET "suppliedSpecs" = '1 Bedroom 1 Bathroom'
WHERE "unitSlug" = 'ancoats-15';

COMMIT;
