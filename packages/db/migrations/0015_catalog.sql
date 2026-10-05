-- 0015 · the catalog (T-M01-027 part a): three platform tables, five tenant tables, four pgEnums,
-- and the audit and subject values the catalog acts record.
--
-- The platform book is READABLE GLOBAL reference data, as the market pack is: no tenant_id, no
-- RLS, SELECT for every member of app_user and no write privilege — the publish command on the
-- admin path is the only writer (M01-46). A platform item carries NO price (M01-37): its rate is
-- the tenant's dated entry, never the platform's.
--
-- The five tenant tables are tenant-scoped, all four always. The rate ledger and the release
-- pair are append-only: SELECT and INSERT alone, no UPDATE and no DELETE for any role, so a past
-- output can always name the rate it used (M01-44) and a release never changes (M01-43). No
-- catalog table grants DELETE: a product is archived, never deleted (M01-42).
--
-- Money: rate_amount is numeric(14,3) with currency_code stamped on every entry at its write;
-- tax is tax_pct numeric(5,2), never a scheme-named column (forward-compat.md, market & money).
-- A spec is one jsonb envelope carrying its own kind, held equal to the column by a CHECK.
--
-- Text search is full-text over brand and model (pg_trgm would need CREATE on the database,
-- which the migration role does not hold); the spec-range indexes are the picker's two (MS4-10):
-- a panel's watt and technology.
--
-- Additive only: new tables, new types, new enum values. Nothing older reads them.

CREATE TYPE "public"."component_kind" AS ENUM('panel', 'inverter', 'battery', 'micro_inverter', 'optimiser');
CREATE TYPE "public"."catalog_provenance_label" AS ENUM('verified_datasheet', 'tenant_provided', 'representative');
CREATE TYPE "public"."catalog_availability" AS ENUM('available', 'out_of_stock', 'discontinued');
CREATE TYPE "public"."release_change_kind" AS ENUM('added', 'changed', 'archived');
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.item_created';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.item_changed';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.item_archived';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.item_unarchived';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.override_changed';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.override_cleared';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.rate_recorded';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'catalog.release_published';
ALTER TYPE "public"."subject_kind" ADD VALUE 'tenant_catalog_item';
ALTER TYPE "public"."subject_kind" ADD VALUE 'catalog_item';
ALTER TYPE "public"."subject_kind" ADD VALUE 'catalog_release';

-- The platform master catalog (M01-33, M01-34, M01-35, M01-42, M01-45).
CREATE TABLE "catalog_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"component_kind" "component_kind" NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"spec" jsonb NOT NULL,
	"provenance_label" "catalog_provenance_label" NOT NULL,
	"availability" "catalog_availability" NOT NULL,
	"archived" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "catalog_item_spec_kind_matches" CHECK (("catalog_item"."spec"->>'kind') = "catalog_item"."component_kind"::text),
	CONSTRAINT "catalog_item_provenance_is_platform" CHECK ("catalog_item"."provenance_label" <> 'tenant_provided')
);
CREATE UNIQUE INDEX "catalog_item_natural_key" ON "catalog_item" USING btree ("component_kind","brand","model");
CREATE INDEX "catalog_item_kind_archived_idx" ON "catalog_item" USING btree ("component_kind","archived");
CREATE INDEX "catalog_item_text_idx" ON "catalog_item" USING gin (to_tsvector('simple', "brand" || ' ' || "model"));
CREATE INDEX "catalog_item_panel_watt_idx" ON "catalog_item" USING btree ((("spec"->>'watt')::numeric)) WHERE "catalog_item"."component_kind" = 'panel';
CREATE INDEX "catalog_item_panel_technology_idx" ON "catalog_item" USING btree (("spec"->>'technology')) WHERE "catalog_item"."component_kind" = 'panel';

-- One platform item's availability in one market (M01-33): every market-scoped list joins here.
CREATE TABLE "catalog_item_market_availability" (
	"catalog_item_id" uuid NOT NULL,
	"market_code" text NOT NULL,
	CONSTRAINT "catalog_item_market_availability_pk" PRIMARY KEY("catalog_item_id","market_code")
);
ALTER TABLE "catalog_item_market_availability" ADD CONSTRAINT "catalog_item_market_availability_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_item_market_availability" ADD CONSTRAINT "catalog_item_market_availability_market_code_market_pack_market_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."market_pack"("market_code") ON DELETE no action ON UPDATE no action;
CREATE INDEX "catalog_item_market_availability_market_idx" ON "catalog_item_market_availability" USING btree ("market_code","catalog_item_id");

-- One scheme-keyed certification held by one platform item (M01-34, F1-44): the row IS the claim.
CREATE TABLE "catalog_item_certification" (
	"catalog_item_id" uuid NOT NULL,
	"scheme_key" text NOT NULL,
	"reference" text,
	CONSTRAINT "catalog_item_certification_pk" PRIMARY KEY("catalog_item_id","scheme_key")
);
ALTER TABLE "catalog_item_certification" ADD CONSTRAINT "catalog_item_certification_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE no action ON UPDATE no action;

-- Readable global reference data: SELECT held by every member of app_user, no write privilege.
GRANT SELECT ON TABLE "catalog_item", "catalog_item_market_availability", "catalog_item_certification" TO app_user;

-- A tenant's own full SKU (M01-36, M01-39, M01-42): theirs alone, usable everywhere a platform item is.
CREATE TABLE "tenant_catalog_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"component_kind" "component_kind" NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"spec" jsonb NOT NULL,
	"certifications" jsonb NOT NULL,
	"source_datasheet_id" uuid,
	"preferred" boolean NOT NULL,
	"archived" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "tenant_catalog_item_spec_kind_matches" CHECK (("tenant_catalog_item"."spec"->>'kind') = "tenant_catalog_item"."component_kind"::text)
);
ALTER TABLE "tenant_catalog_item" ADD CONSTRAINT "tenant_catalog_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tenant_catalog_item" ADD CONSTRAINT "tenant_catalog_item_source_datasheet_id_file_id_fk" FOREIGN KEY ("source_datasheet_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "tenant_catalog_item_tenant_kind_archived_idx" ON "tenant_catalog_item" USING btree ("tenant_id","component_kind","archived");
CREATE UNIQUE INDEX "tenant_catalog_item_tenant_creation_key" ON "tenant_catalog_item" USING btree ("tenant_id","creation_key") WHERE "tenant_catalog_item"."creation_key" is not null;
CREATE INDEX "tenant_catalog_item_text_idx" ON "tenant_catalog_item" USING gin (to_tsvector('simple', "brand" || ' ' || "model"));
CREATE INDEX "tenant_catalog_item_certifications_idx" ON "tenant_catalog_item" USING gin ("certifications" jsonb_path_ops);
CREATE INDEX "tenant_catalog_item_panel_watt_idx" ON "tenant_catalog_item" USING btree ("tenant_id",(("spec"->>'watt')::numeric)) WHERE "tenant_catalog_item"."component_kind" = 'panel';
CREATE INDEX "tenant_catalog_item_panel_technology_idx" ON "tenant_catalog_item" USING btree ("tenant_id",("spec"->>'technology')) WHERE "tenant_catalog_item"."component_kind" = 'panel';

-- A tenant's sparse override on one platform item (M01-37): only changed fields, at most one per item.
CREATE TABLE "tenant_catalog_override" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"tax_pct" numeric(5, 2),
	"hidden" boolean NOT NULL,
	"preferred" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
ALTER TABLE "tenant_catalog_override" ADD CONSTRAINT "tenant_catalog_override_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tenant_catalog_override" ADD CONSTRAINT "tenant_catalog_override_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "tenant_catalog_override_tenant_item_key" ON "tenant_catalog_override" USING btree ("tenant_id","catalog_item_id");

-- The append-only dated ledger of a component's rate (M01-44): never an in-place edit.
CREATE TABLE "catalog_rate_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_catalog_item_id" uuid,
	"tenant_catalog_override_id" uuid,
	"rate_amount" numeric(14, 3),
	"currency_code" text NOT NULL,
	"entry_date" date NOT NULL,
	"sequence" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
	"entered_by" uuid NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "catalog_rate_entry_one_parent" CHECK (("catalog_rate_entry"."tenant_catalog_item_id" is null) <> ("catalog_rate_entry"."tenant_catalog_override_id" is null))
);
ALTER TABLE "catalog_rate_entry" ADD CONSTRAINT "catalog_rate_entry_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_rate_entry" ADD CONSTRAINT "catalog_rate_entry_tenant_catalog_item_id_tenant_catalog_item_id_fk" FOREIGN KEY ("tenant_catalog_item_id") REFERENCES "public"."tenant_catalog_item"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_rate_entry" ADD CONSTRAINT "catalog_rate_entry_tenant_catalog_override_id_tenant_catalog_override_id_fk" FOREIGN KEY ("tenant_catalog_override_id") REFERENCES "public"."tenant_catalog_override"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_rate_entry" ADD CONSTRAINT "catalog_rate_entry_entered_by_user_account_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "catalog_rate_entry_sequence_key" ON "catalog_rate_entry" USING btree ("sequence");
CREATE UNIQUE INDEX "catalog_rate_entry_tenant_creation_key" ON "catalog_rate_entry" USING btree ("tenant_id","creation_key") WHERE "catalog_rate_entry"."creation_key" is not null;
CREATE INDEX "catalog_rate_entry_tenant_item_date_idx" ON "catalog_rate_entry" USING btree ("tenant_id","tenant_catalog_item_id","entry_date" DESC NULLS LAST,"sequence" DESC NULLS LAST);
CREATE INDEX "catalog_rate_entry_tenant_override_date_idx" ON "catalog_rate_entry" USING btree ("tenant_id","tenant_catalog_override_id","entry_date" DESC NULLS LAST,"sequence" DESC NULLS LAST);

-- A labelled, append-only publish of the tenant's catalog changes (M01-43, M01-49, F8-13..15).
CREATE TABLE "catalog_release" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"label" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"published_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text
);
ALTER TABLE "catalog_release" ADD CONSTRAINT "catalog_release_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_release" ADD CONSTRAINT "catalog_release_published_by_user_account_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "catalog_release_tenant_label_key" ON "catalog_release" USING btree ("tenant_id","label");
CREATE UNIQUE INDEX "catalog_release_tenant_creation_key" ON "catalog_release" USING btree ("tenant_id","creation_key") WHERE "catalog_release"."creation_key" is not null;
CREATE INDEX "catalog_release_tenant_published_idx" ON "catalog_release" USING btree ("tenant_id","published_at" DESC NULLS LAST);

-- One changed item of a release, as a before and an after (M01-43). Immutable with the release.
CREATE TABLE "catalog_release_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"catalog_release_id" uuid NOT NULL,
	"catalog_item_id" uuid,
	"tenant_catalog_item_id" uuid,
	"change_kind" "release_change_kind" NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	CONSTRAINT "catalog_release_line_one_item" CHECK (("catalog_release_line"."catalog_item_id" is null) <> ("catalog_release_line"."tenant_catalog_item_id" is null))
);
ALTER TABLE "catalog_release_line" ADD CONSTRAINT "catalog_release_line_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_release_line" ADD CONSTRAINT "catalog_release_line_catalog_release_id_catalog_release_id_fk" FOREIGN KEY ("catalog_release_id") REFERENCES "public"."catalog_release"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_release_line" ADD CONSTRAINT "catalog_release_line_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "catalog_release_line" ADD CONSTRAINT "catalog_release_line_tenant_catalog_item_id_tenant_catalog_item_id_fk" FOREIGN KEY ("tenant_catalog_item_id") REFERENCES "public"."tenant_catalog_item"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "catalog_release_line_tenant_release_idx" ON "catalog_release_line" USING btree ("tenant_id","catalog_release_id");
CREATE INDEX "catalog_release_line_tenant_item_idx" ON "catalog_release_line" USING btree ("tenant_id","catalog_item_id");
CREATE INDEX "catalog_release_line_tenant_own_item_idx" ON "catalog_release_line" USING btree ("tenant_id","tenant_catalog_item_id");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "tenant_catalog_item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_catalog_item" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_catalog_item_tenant" ON "tenant_catalog_item" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "tenant_catalog_item" TO app_user;

ALTER TABLE "tenant_catalog_override" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_catalog_override" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_catalog_override_tenant" ON "tenant_catalog_override" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "tenant_catalog_override" TO app_user;

-- The ledger: SELECT and INSERT alone — no role holds UPDATE or DELETE (M01-44).
ALTER TABLE "catalog_rate_entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_rate_entry" FORCE ROW LEVEL SECURITY;
CREATE POLICY "catalog_rate_entry_tenant" ON "catalog_rate_entry" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "catalog_rate_entry" TO app_user;

-- The release pair: SELECT and INSERT alone — a release and its lines never change (M01-43).
ALTER TABLE "catalog_release" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_release" FORCE ROW LEVEL SECURITY;
CREATE POLICY "catalog_release_tenant" ON "catalog_release" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "catalog_release" TO app_user;

ALTER TABLE "catalog_release_line" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_release_line" FORCE ROW LEVEL SECURITY;
CREATE POLICY "catalog_release_line_tenant" ON "catalog_release_line" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "catalog_release_line" TO app_user;
