-- 0019 · the catalog import job (T-M01-030 part c): one tenant table and three pgEnums — the job a
-- stored price list becomes, and what its read step counted in the file.
--
-- Tenant-scoped, all four always. SELECT, INSERT and UPDATE for app_user: a job moves through its
-- states (reading → mapped, or unreadable) and is kept; no DELETE, since nothing purges a report
-- (M01-41: kept and re-openable). The whole state machine is declared now, so later phases add no
-- enum value.
--
-- Additive only: a new table and new types nothing older reads.

CREATE TYPE "public"."catalog_import_entry_point" AS ENUM('onboarding', 'settings', 'in_flow');
CREATE TYPE "public"."catalog_import_status" AS ENUM('reading', 'unreadable', 'mapped', 'matching', 'previewed', 'running', 'completed');
CREATE TYPE "public"."catalog_import_unreadable_reason" AS ENUM('cannot_open', 'too_large_unpacked', 'no_rows', 'not_read');
CREATE TABLE "catalog_import_job" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"entry_point" "catalog_import_entry_point" NOT NULL,
	"status" "catalog_import_status" NOT NULL,
	"unreadable_reason" "catalog_import_unreadable_reason",
	"file_name" text NOT NULL,
	"saved_at" timestamp with time zone,
	"sheets" jsonb,
	"started_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "catalog_import_job_file_name_length" CHECK (char_length("catalog_import_job"."file_name") between 1 and 255),
	CONSTRAINT "catalog_import_job_unreadable_has_reason" CHECK (("catalog_import_job"."status" = 'unreadable') = ("catalog_import_job"."unreadable_reason" is not null))
);

ALTER TABLE "catalog_import_job" ADD CONSTRAINT "catalog_import_job_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_job" ADD CONSTRAINT "catalog_import_job_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_job" ADD CONSTRAINT "catalog_import_job_started_by_user_account_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "catalog_import_job_tenant_created_idx" ON "catalog_import_job" USING btree ("tenant_id","created_at" DESC NULLS LAST);
CREATE UNIQUE INDEX "catalog_import_job_tenant_creation_key" ON "catalog_import_job" USING btree ("tenant_id","creation_key") WHERE "catalog_import_job"."creation_key" is not null;
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "catalog_import_job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_import_job" FORCE ROW LEVEL SECURITY;
CREATE POLICY "catalog_import_job_tenant" ON "catalog_import_job" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "catalog_import_job" TO app_user;
