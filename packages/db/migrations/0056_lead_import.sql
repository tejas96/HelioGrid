-- 0056 · the lead import (T-M02-005; RFC decision 16): two tenant tables and one pgEnum — the job
-- a stored spreadsheet becomes, one row per filled sheet row with the preview's verdict and the run's
-- result on it, and the one bulk choice for duplicates (skip, or log as enquiry; never keep both).
--
-- One import family, lifted and never copied (decision 16): the job walks the catalog import's
-- state machine, so its status and unreadable reason are those two existing types, not a second
-- copy of them — whoever lifts the family renames each once. The mapping, its revision and the
-- runner pair behave as `catalog_import_job`'s do (0019–0021).
--
-- A row's verdict is what it names, so no outcome vocabulary is stored: problems (why it cannot
-- land — the report's reasons, M02-21) or none; the customer its number met, or the earlier row of
-- the same file with that number — a duplicate; else a new lead. The run's result is the same: the
-- lead it landed, the enquiry it logged on the existing record (M02-20), or neither — skipped. The
-- duplicate choice is the run's, set with it (skip is the screen's default). Counts are read off the
-- rows, never stored. Landed rows are never rolled back (M02-21).
--
-- Tenant-scoped, all four always. SELECT, INSERT and UPDATE for app_user on the job, which moves
-- through its states and is kept; DELETE as well on the rows, because a new mapping's pass replaces
-- the rows of the one it supersedes before anything runs (as 0020's do).
--
-- Additive only: new tables and a new type nothing older reads.
CREATE TYPE "public"."import_duplicate_choice" AS ENUM('skip', 'log_enquiry');--> statement-breakpoint
CREATE TABLE "lead_import" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"status" "catalog_import_status" NOT NULL,
	"unreadable_reason" "catalog_import_unreadable_reason",
	"file_name" text NOT NULL,
	"saved_at" timestamp with time zone,
	"sheets" jsonb,
	"mapping" jsonb,
	"mapping_revision" integer DEFAULT 0 NOT NULL,
	"duplicate_choice" "import_duplicate_choice",
	"run_at" timestamp with time zone,
	"run_by" uuid,
	"started_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "lead_import_file_name_length" CHECK (char_length("lead_import"."file_name") between 1 and 255),
	CONSTRAINT "lead_import_unreadable_has_reason" CHECK (("lead_import"."status" = 'unreadable') = ("lead_import"."unreadable_reason" is not null)),
	CONSTRAINT "lead_import_matched_has_mapping" CHECK ("lead_import"."status" not in ('matching', 'previewed', 'running', 'completed') or "lead_import"."mapping" is not null),
	CONSTRAINT "lead_import_run_is_whole" CHECK (("lead_import"."status" in ('running', 'completed')) = ("lead_import"."run_at" is not null) and ("lead_import"."run_at" is null) = ("lead_import"."run_by" is null) and ("lead_import"."run_at" is null) = ("lead_import"."duplicate_choice" is null))
);
--> statement-breakpoint
CREATE TABLE "lead_import_row" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"import_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"cells" jsonb NOT NULL,
	"phone_e164" text,
	"problems" jsonb NOT NULL,
	"duplicate_of_customer_id" uuid,
	"repeats_row" integer,
	"lead_id" uuid,
	"enquiry_activity_id" uuid,
	"ran_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "lead_import_row_number_positive" CHECK ("lead_import_row"."row_number" >= 1),
	CONSTRAINT "lead_import_row_repeats_an_earlier_row" CHECK ("lead_import_row"."repeats_row" >= 1 and "lead_import_row"."repeats_row" < "lead_import_row"."row_number"),
	CONSTRAINT "lead_import_row_problems_are_a_list" CHECK (jsonb_typeof("lead_import_row"."problems") = 'array'),
	CONSTRAINT "lead_import_row_rejected_lands_nothing" CHECK (jsonb_array_length("lead_import_row"."problems") = 0 or ("lead_import_row"."duplicate_of_customer_id" is null and "lead_import_row"."repeats_row" is null and "lead_import_row"."lead_id" is null and "lead_import_row"."enquiry_activity_id" is null)),
	CONSTRAINT "lead_import_row_duplicate_lands_no_lead" CHECK (("lead_import_row"."duplicate_of_customer_id" is null and "lead_import_row"."repeats_row" is null) or "lead_import_row"."lead_id" is null),
	CONSTRAINT "lead_import_row_enquiry_only_on_a_duplicate" CHECK ("lead_import_row"."enquiry_activity_id" is null or "lead_import_row"."duplicate_of_customer_id" is not null or "lead_import_row"."repeats_row" is not null),
	CONSTRAINT "lead_import_row_result_needs_the_run" CHECK ("lead_import_row"."ran_at" is not null or ("lead_import_row"."lead_id" is null and "lead_import_row"."enquiry_activity_id" is null))
);
--> statement-breakpoint
ALTER TABLE "lead_import" ADD CONSTRAINT "lead_import_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import" ADD CONSTRAINT "lead_import_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import" ADD CONSTRAINT "lead_import_run_by_user_account_id_fk" FOREIGN KEY ("run_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import" ADD CONSTRAINT "lead_import_started_by_user_account_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import_row" ADD CONSTRAINT "lead_import_row_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import_row" ADD CONSTRAINT "lead_import_row_import_id_lead_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."lead_import"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import_row" ADD CONSTRAINT "lead_import_row_duplicate_of_customer_id_customer_id_fk" FOREIGN KEY ("duplicate_of_customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import_row" ADD CONSTRAINT "lead_import_row_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_import_row" ADD CONSTRAINT "lead_import_row_enquiry_activity_id_activity_id_fk" FOREIGN KEY ("enquiry_activity_id") REFERENCES "public"."activity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_import_tenant_created_idx" ON "lead_import" USING btree ("tenant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "lead_import_tenant_creation_key" ON "lead_import" USING btree ("tenant_id","creation_key") WHERE "lead_import"."creation_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_import_row_tenant_import_row_key" ON "lead_import_row" USING btree ("tenant_id","import_id","row_number");--> statement-breakpoint
CREATE INDEX "lead_import_row_tenant_import_phone_idx" ON "lead_import_row" USING btree ("tenant_id","import_id","phone_e164");--> statement-breakpoint
CREATE INDEX "lead_import_row_tenant_import_ran_idx" ON "lead_import_row" USING btree ("tenant_id","import_id","ran_at","row_number");--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "lead_import" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_import" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_import_tenant" ON "lead_import" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "lead_import" TO app_user;--> statement-breakpoint
ALTER TABLE "lead_import_row" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_import_row" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_import_row_tenant" ON "lead_import_row" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "lead_import_row" TO app_user;
