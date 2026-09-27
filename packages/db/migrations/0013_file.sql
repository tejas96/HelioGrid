-- 0013 · the one files table (T-FPLAT-035): one tenant-scoped table and two pgEnums.
--
-- Every stored byte-stream in the suite is one row here (forward-compat.md). A module's own row —
-- a survey photograph, an employee document — keeps its domain facts and points at one of these;
-- the size, checksum, type and store location live only here, which is what M12's gauge measures.
--
-- Tenancy: file is TENANT-SCOPED, all four — tenant_id, keys leading with it, a fail-closed
-- policy for app_user, explicit grants.
--
-- The grants are SELECT, INSERT and UPDATE ON uploaded_at ALONE. A row is written when the file is
-- declared and becomes readable only when complete sets uploaded_at, once, from null. No role can
-- re-point a stored file at other bytes or another owner, and none can delete one — erasure is
-- pack.data-rights' own slice.
--
-- provider + external_id is the provider-ref pair: a vendor move copies objects and re-points
-- rows. storage_provider never crosses the wire; file_content_type mirrors the contract's enum.
--
-- Growth: one row per declare. Rows never completed stay, unreadable, until M12's quota and sweep
-- land; that window is named on the task rather than hidden.
--
-- Additive only: a new table and two new types. Nothing older reads them.

CREATE TYPE "public"."file_content_type" AS ENUM('image/png', 'image/jpeg');
CREATE TYPE "public"."storage_provider" AS ENUM('local');
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject_kind" "subject_kind" NOT NULL,
	"subject_ref" uuid NOT NULL,
	"provider" "storage_provider" NOT NULL,
	"external_id" text NOT NULL,
	"content_type" "file_content_type" NOT NULL,
	"byte_size" bigint NOT NULL,
	"checksum_sha256" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"declared_at" timestamp with time zone NOT NULL,
	"uploaded_at" timestamp with time zone,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "file_byte_size_positive" CHECK ("file"."byte_size" >= 1)
);
ALTER TABLE "file" ADD CONSTRAINT "file_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_user_account_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "file_tenant_provider_external_key" ON "file" USING btree ("tenant_id","provider","external_id");
CREATE UNIQUE INDEX "file_tenant_creation_key" ON "file" USING btree ("tenant_id","creation_key") WHERE "file"."creation_key" is not null;
CREATE INDEX "file_tenant_subject_idx" ON "file" USING btree ("tenant_id","subject_kind","subject_ref");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "file" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "file" FORCE ROW LEVEL SECURITY;
CREATE POLICY "file_tenant" ON "file" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "file" TO app_user;
GRANT UPDATE ("uploaded_at") ON TABLE "file" TO app_user;
