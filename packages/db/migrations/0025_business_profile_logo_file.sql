-- 0025 · the company's logo (T-M01-005e): the file slice stores a company's image (0013) and nothing
-- said which stored file is the logo — the profile every document reads had nowhere to point (M01-31).
--
-- Expand only: nullable, no default, no backfill, no index (read with its row by "tenant_id", which is
-- unique). Older code never selects the column; a client built before the field existed saves without
-- naming it, and the api then keeps what is stored.

ALTER TABLE "business_profile" ADD COLUMN "logo_file_id" uuid;--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_logo_file_id_file_id_fk" FOREIGN KEY ("logo_file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;
