-- 0049 · Company text is one value (T-FPLAT-089): the words a company types are one value,
-- shown as written (F3-10, owner ruling 2026-11-09). Each stored `{ "en": …, "hi": …, "mr": … }`
-- keeps its `en` version: every company's default language is English (tenant creation writes
-- UI_SOURCE_LOCALE), so `en` is the default-language version the ruling keeps. No release has
-- shipped, so no older reader meets the new shape.

ALTER TABLE "price_book_rate" ALTER COLUMN "name" SET DATA TYPE text USING "name"->>'en';--> statement-breakpoint
ALTER TABLE "tranche_template" ALTER COLUMN "name" SET DATA TYPE text USING "name"->>'en';--> statement-breakpoint
ALTER TABLE "tranche_template_line" ALTER COLUMN "label" SET DATA TYPE text USING "label"->>'en';--> statement-breakpoint

-- Terms and phases still the platform's are stored as null, so they keep following each reader.
ALTER TABLE "proposal_template_settings" ALTER COLUMN "default_terms" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "timeline_template" ALTER COLUMN "phases" DROP NOT NULL;--> statement-breakpoint

UPDATE "proposal_template_settings"
SET "default_terms" = "default_terms"->'en';--> statement-breakpoint

UPDATE "proposal_template_settings"
SET "cover" = jsonb_set("cover", '{aboutCompany}', COALESCE("cover"->'aboutCompany'->'en', 'null'::jsonb))
WHERE "cover" IS NOT NULL;--> statement-breakpoint

UPDATE "branding_settings"
SET "letterhead" = jsonb_build_object(
  'tagline', COALESCE("letterhead"->'tagline'->'en', 'null'::jsonb),
  'lines', COALESCE(
    (SELECT jsonb_agg(line->'en' ORDER BY position)
       FROM jsonb_array_elements("letterhead"->'lines') WITH ORDINALITY AS held(line, position)),
    '[]'::jsonb),
  'footerNote', COALESCE("letterhead"->'footerNote'->'en', 'null'::jsonb))
WHERE "letterhead" IS NOT NULL;--> statement-breakpoint

UPDATE "timeline_template"
SET "phases" = COALESCE(
  (SELECT jsonb_agg(
            jsonb_build_object('name', phase->'name'->'en', 'description', phase->'description'->'en')
            ORDER BY position)
     FROM jsonb_array_elements("phases") WITH ORDINALITY AS held(phase, position)),
  '[]'::jsonb);
