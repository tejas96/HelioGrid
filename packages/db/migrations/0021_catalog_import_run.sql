-- 0021 · the catalog import's run (T-M01-030 part f): who pressed import and when, and what the run
-- did with every row.
--
-- catalog_import_job gains run_at and run_by: a running or completed job names both, a job never
-- run names neither. The run's rate entries are dated run_at's day on the tenant's clock, and
-- run_by is the actor of every catalog write and audit entry the run makes.
--
-- catalog_import_row gains its result, the reason a failed row gives, the dated rate entry a written
-- row made and the own SKU a new product became. A row's result commits in the same transaction as
-- its catalog writes, so a retried step finds it and writes nothing twice. Progress and the
-- report's figures are read off these rows, never stored.
--
-- Additive only: columns nothing older selects (each api reads named columns) and new types nothing
-- older reads. No new table, so the tenancy and grants of 0019 and 0020 stand.

CREATE TYPE "public"."catalog_import_row_failure" AS ENUM('changed_since_preview', 'not_applied');
CREATE TYPE "public"."catalog_import_row_result" AS ENUM('price_applied', 'product_created', 'left_out', 'failed');
ALTER TABLE "catalog_import_job" ADD COLUMN "run_at" timestamp with time zone;
ALTER TABLE "catalog_import_job" ADD COLUMN "run_by" uuid;
ALTER TABLE "catalog_import_row" ADD COLUMN "result" "catalog_import_row_result";
ALTER TABLE "catalog_import_row" ADD COLUMN "failure" "catalog_import_row_failure";
ALTER TABLE "catalog_import_row" ADD COLUMN "rate_entry_id" uuid;
ALTER TABLE "catalog_import_row" ADD COLUMN "created_item_id" uuid;
ALTER TABLE "catalog_import_job" ADD CONSTRAINT "catalog_import_job_run_by_user_account_id_fk" FOREIGN KEY ("run_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_rate_entry_id_catalog_rate_entry_id_fk" FOREIGN KEY ("rate_entry_id") REFERENCES "public"."catalog_rate_entry"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_created_item_id_tenant_catalog_item_id_fk" FOREIGN KEY ("created_item_id") REFERENCES "public"."tenant_catalog_item"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "catalog_import_row_tenant_job_result_idx" ON "catalog_import_row" USING btree ("tenant_id","job_id","result","row_number");
ALTER TABLE "catalog_import_job" ADD CONSTRAINT "catalog_import_job_run_has_runner" CHECK (("catalog_import_job"."status" in ('running', 'completed')) = ("catalog_import_job"."run_at" is not null) and ("catalog_import_job"."run_at" is null) = ("catalog_import_job"."run_by" is null));
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_result_names_its_write" CHECK (("catalog_import_row"."result" is not distinct from 'failed') = ("catalog_import_row"."failure" is not null) and coalesce("catalog_import_row"."result" in ('price_applied', 'product_created'), false) = ("catalog_import_row"."rate_entry_id" is not null) and ("catalog_import_row"."result" is not distinct from 'product_created') = ("catalog_import_row"."created_item_id" is not null));