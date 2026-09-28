-- Normalise Enquiry.status to the canonical English vocabulary.
--
-- WHEN: only AFTER the code that understands both vocabularies is live
-- (server/leads.js). That code already maps novo/lido/arquivado on read, so
-- this migration changes nothing visible — it just cleans the stored data.
--
-- BEFORE RUNNING: export the Enquiry table as CSV (Table Editor → Export),
-- since backups are not confirmed. Run first on the test project.
--
-- Safe to run more than once.

-- 1) Preview what will change:
SELECT status, count(*) FROM "Enquiry" GROUP BY status ORDER BY status;

-- 2) Rewrite legacy values:
UPDATE "Enquiry"
SET status = CASE status
  WHEN 'novo'      THEN 'new'
  WHEN 'lido'      THEN 'contacted'
  WHEN 'arquivado' THEN 'closed'
END
WHERE status IN ('novo', 'lido', 'arquivado');

-- 3) Check: only new / contacted / closed should remain.
SELECT status, count(*) FROM "Enquiry" GROUP BY status ORDER BY status;

-- 4) Default for rows inserted without a status (the app always sends one,
--    but keep the database consistent with the canonical vocabulary).
ALTER TABLE "Enquiry" ALTER COLUMN status SET DEFAULT 'new';

-- Schema notes (checked in production 2026-09-28):
--   * no CHECK constraint on status — any value is accepted;
--   * the unit column is lower-case "unitslug" (the app maps it to unitSlug);
--   * the table was empty: the contact form had never saved an enquiry.
