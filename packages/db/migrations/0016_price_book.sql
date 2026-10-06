-- 0016 · the price book (T-M01-031): two tenant tables, one pgEnum, and the audit and subject
-- values a publish records.
--
-- Both tables are tenant-scoped, all four always, and append-only: SELECT and INSERT alone, no
-- UPDATE, DELETE or TRUNCATE for app_user, because a version is immutable and a rate change is a
-- new version (M01-48); a sent proposal keeps the version it pinned forever (M01-49). The version
-- in force is the tenant's highest version_number — derived by the read, never a stored flag.
--
-- Money: amount is numeric(14,3) with currency_code stamped on the version at its publish; the
-- default margin is default_margin_pct numeric(5,2).
--
-- Additive only: new tables, a new type, new enum values. Nothing older reads them.

CREATE TYPE "public"."price_book_rate_basis" AS ENUM('per_job', 'per_kw', 'per_visit', 'per_metre');
ALTER TYPE "public"."audit_event_type" ADD VALUE 'price_book.version_published';
ALTER TYPE "public"."subject_kind" ADD VALUE 'price_book_version';
CREATE TABLE "price_book_rate" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"price_book_version_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" jsonb NOT NULL,
	"basis" "price_book_rate_basis" NOT NULL,
	"amount" numeric(14, 3) NOT NULL
);

CREATE TABLE "price_book_version" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"default_margin_pct" numeric(5, 2) NOT NULL,
	"currency_code" text NOT NULL,
	"note" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"published_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text
);

ALTER TABLE "price_book_rate" ADD CONSTRAINT "price_book_rate_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "price_book_rate" ADD CONSTRAINT "price_book_rate_price_book_version_id_price_book_version_id_fk" FOREIGN KEY ("price_book_version_id") REFERENCES "public"."price_book_version"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "price_book_version" ADD CONSTRAINT "price_book_version_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "price_book_version" ADD CONSTRAINT "price_book_version_published_by_user_account_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "price_book_rate_tenant_version_idx" ON "price_book_rate" USING btree ("tenant_id","price_book_version_id");
CREATE UNIQUE INDEX "price_book_version_tenant_number_key" ON "price_book_version" USING btree ("tenant_id","version_number");
CREATE UNIQUE INDEX "price_book_version_tenant_creation_key" ON "price_book_version" USING btree ("tenant_id","creation_key") WHERE "price_book_version"."creation_key" is not null;
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "price_book_version" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "price_book_version" FORCE ROW LEVEL SECURITY;
CREATE POLICY "price_book_version_tenant" ON "price_book_version" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "price_book_version" TO app_user;

ALTER TABLE "price_book_rate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "price_book_rate" FORCE ROW LEVEL SECURITY;
CREATE POLICY "price_book_rate_tenant" ON "price_book_rate" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "price_book_rate" TO app_user;
