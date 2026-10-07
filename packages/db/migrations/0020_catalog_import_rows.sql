-- 0020 · the catalog import's rows (T-M01-030 part d): the mapping a job is matched by, and one row
-- per filled sheet row with the matching pass's verdict on it.
--
-- catalog_import_job gains the confirmed mapping and its revision: every confirmed mapping raises
-- the revision, and a pass started for an older one writes nothing. A job matching, previewed, run
-- or completed holds its mapping.
--
-- catalog_import_row is tenant-scoped, all four always. SELECT, INSERT, UPDATE and DELETE for
-- app_user: a new mapping's pass replaces the rows of the one it supersedes, before anything runs.
-- The counts are read off the rows, never stored.
--
-- Additive only: two columns nothing older selects (each api reads named columns), a new table and
-- new types nothing older reads.

CREATE TYPE "public"."catalog_import_conflict_answer" AS ENUM('keep_catalog_spec', 'import_as_own_item');
CREATE TYPE "public"."catalog_import_row_outcome" AS ENUM('price_override', 'own_item_price', 'new_item', 'needs_attention', 'left_out');

ALTER TABLE "catalog_import_job" ADD COLUMN "mapping" jsonb;
ALTER TABLE "catalog_import_job" ADD COLUMN "mapping_revision" integer DEFAULT 0 NOT NULL;
ALTER TABLE "catalog_import_job" ADD CONSTRAINT "catalog_import_job_matched_has_mapping" CHECK ("catalog_import_job"."status" not in ('matching', 'previewed', 'running', 'completed') or "catalog_import_job"."mapping" is not null);

CREATE TABLE "catalog_import_row" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"cells" jsonb NOT NULL,
	"fix" jsonb NOT NULL,
	"left_out" boolean NOT NULL,
	"answer" "catalog_import_conflict_answer",
	"outcome" "catalog_import_row_outcome" NOT NULL,
	"attention" jsonb NOT NULL,
	"catalog_item_id" uuid,
	"tenant_catalog_item_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "catalog_import_row_number_positive" CHECK ("catalog_import_row"."row_number" >= 1),
	CONSTRAINT "catalog_import_row_match_names_its_item" CHECK (("catalog_import_row"."outcome" = 'price_override') = ("catalog_import_row"."catalog_item_id" is not null) and ("catalog_import_row"."outcome" = 'own_item_price') = ("catalog_import_row"."tenant_catalog_item_id" is not null))
);

ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_job_id_catalog_import_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."catalog_import_job"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_tenant_catalog_item_id_tenant_catalog_item_id_fk" FOREIGN KEY ("tenant_catalog_item_id") REFERENCES "public"."tenant_catalog_item"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "catalog_import_row_tenant_job_row_key" ON "catalog_import_row" USING btree ("tenant_id","job_id","row_number");
CREATE INDEX "catalog_import_row_tenant_job_outcome_idx" ON "catalog_import_row" USING btree ("tenant_id","job_id","outcome","row_number");
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "catalog_import_row" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_import_row" FORCE ROW LEVEL SECURITY;
CREATE POLICY "catalog_import_row_tenant" ON "catalog_import_row" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "catalog_import_row" TO app_user;
