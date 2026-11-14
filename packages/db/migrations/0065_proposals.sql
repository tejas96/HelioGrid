-- 0065 · proposals (block 8, M06; owner rulings 2026-11-13). One commercial document on a lead:
-- `proposal` holds the draft — its eleven-step field set as ONE value, edited on `revision` — and
-- the position its lists read; `proposal_version` freezes the whole of it at Generate, with what it
-- was computed from; `proposal_share` records each tap that marked it shared. `saved_part` is the
-- company's own cable, electrical and structure parts. `energy_estimate` keeps what the energy
-- source of record answered for a point, so it is asked once per point.
--
-- The lead gains where the system goes and the supply it meets (M06-09, M06-16); the project gains
-- the version it runs on (M08-50); the proposal template gains the cover picture a new proposal
-- starts with (T-M01-030).
--
-- Tenant-scoped, all four always, except `energy_estimate`: global reference data, SELECT alone for
-- app_user and written on the admin path. `proposal_version` and `proposal_share` are ledgers:
-- SELECT and INSERT alone, and they join `append-only-ledgers.ts`. `proposal` takes DELETE too, for
-- a draft discarded before its first Generate — nobody was ever shown it.
--
-- Additive only: new tables and types, new nullable columns, and new values at the end of
-- tenant_counter_kind, subject_kind, audit_event_type, activity_kind and task_provenance. An older
-- reader never writes the new columns and reads a row without them as it always did; an older app
-- shows an unknown timeline kind as a plain entry. The new enum values are not used in this
-- transaction.
CREATE TYPE "public"."energy_database" AS ENUM('SARAH3', 'ERA5');--> statement-breakpoint
CREATE TYPE "public"."supply_phase" AS ENUM('single', 'three');--> statement-breakpoint
CREATE TYPE "public"."proposal_answer" AS ENUM('accept', 'negotiate', 'decline');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'shared', 'accepted', 'declined', 'superseded', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."saved_part_kind" AS ENUM('cable', 'electrical', 'structure');--> statement-breakpoint
CREATE TYPE "public"."share_channel" AS ENUM('whatsapp', 'copy_link');--> statement-breakpoint
CREATE TYPE "public"."version_trigger" AS ENUM('first_generate', 'regenerate');--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_generated';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_shared';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_withdrawn';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'proposals.proposal_generated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'proposals.discount_applied';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'proposals.version_created';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'proposals.proposal_shared';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'proposals.proposal_withdrawn';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'proposals.version_put_in_force';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'proposal';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'proposal_version';--> statement-breakpoint
ALTER TYPE "public"."task_provenance" ADD VALUE 'proposal_shared';--> statement-breakpoint
ALTER TYPE "public"."task_provenance" ADD VALUE 'proposal_accepted';--> statement-breakpoint
ALTER TYPE "public"."task_provenance" ADD VALUE 'proposal_declined';--> statement-breakpoint
ALTER TYPE "public"."tenant_counter_kind" ADD VALUE 'proposal';--> statement-breakpoint
CREATE TABLE "energy_estimate" (
	"latitude" numeric(5, 2) NOT NULL,
	"longitude" numeric(6, 2) NOT NULL,
	"database" "energy_database" NOT NULL,
	"yield_per_kwp" jsonb NOT NULL,
	"asked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "energy_estimate_pkey" PRIMARY KEY("latitude","longitude","database"),
	CONSTRAINT "energy_estimate_point_on_earth" CHECK ("energy_estimate"."latitude" between -90 and 90 and "energy_estimate"."longitude" between -180 and 180),
	CONSTRAINT "energy_estimate_twelve_months" CHECK (jsonb_array_length("energy_estimate"."yield_per_kwp") = 12)
);--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"number" integer,
	"status" "proposal_status" NOT NULL,
	"quick_mode" boolean NOT NULL,
	"revision" integer NOT NULL,
	"field_set" jsonb NOT NULL,
	"payable_minor" bigint,
	"latest_version" integer,
	"shared_version" integer,
	"shared_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"answer" "proposal_answer",
	"answered_at" timestamp with time zone,
	"duplicated_from" uuid,
	"counted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "proposal_revision_counts" CHECK ("proposal"."revision" >= 0),
	CONSTRAINT "proposal_number_counts" CHECK ("proposal"."number" >= 1),
	CONSTRAINT "proposal_numbered_when_generated" CHECK (("proposal"."number" is null) = ("proposal"."latest_version" is null)),
	CONSTRAINT "proposal_versions_in_order" CHECK ("proposal"."latest_version" >= 1 and "proposal"."shared_version" >= 1 and "proposal"."shared_version" <= "proposal"."latest_version"),
	CONSTRAINT "proposal_share_is_whole" CHECK (("proposal"."shared_version" is null) = ("proposal"."shared_at" is null)),
	CONSTRAINT "proposal_answer_is_whole" CHECK (("proposal"."answer" is null) = ("proposal"."answered_at" is null) and ("proposal"."answer" is null or "proposal"."shared_version" is not null)),
	CONSTRAINT "proposal_draft_is_unshared" CHECK ("proposal"."status" <> 'draft' or "proposal"."shared_version" is null)
);--> statement-breakpoint
CREATE TABLE "proposal_share" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"channel" "share_channel" NOT NULL,
	"shared_at" timestamp with time zone NOT NULL,
	"shared_by" uuid NOT NULL,
	CONSTRAINT "proposal_share_version_counts" CHECK ("proposal_share"."version" >= 1)
);--> statement-breakpoint
CREATE TABLE "proposal_version" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"pins" jsonb NOT NULL,
	"currency_code" text NOT NULL,
	"payable_minor" bigint NOT NULL,
	"trigger" "version_trigger" NOT NULL,
	"change_note" text,
	"generated_at" timestamp with time zone NOT NULL,
	"generated_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "proposal_version_counts" CHECK ("proposal_version"."version" >= 1),
	CONSTRAINT "proposal_version_payable_above_zero" CHECK ("proposal_version"."payable_minor" > 0),
	CONSTRAINT "proposal_version_currency_is_iso" CHECK ("proposal_version"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "proposal_version_first_is_first" CHECK (("proposal_version"."version" = 1) = ("proposal_version"."trigger" = 'first_generate')),
	CONSTRAINT "proposal_version_change_is_noted" CHECK ("proposal_version"."version" = 1 or char_length(btrim("proposal_version"."change_note")) >= 1)
);--> statement-breakpoint
CREATE TABLE "saved_part" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kind" "saved_part_kind" NOT NULL,
	"brand" text NOT NULL,
	"specification" text NOT NULL,
	"warranty" text,
	"description" text,
	"match_key" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "saved_part_words_given" CHECK (char_length(btrim("saved_part"."brand")) >= 1 and char_length(btrim("saved_part"."specification")) >= 1 and char_length("saved_part"."match_key") >= 1)
);--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_address" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_area" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_district" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "sanctioned_load_kw" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "supply_phase" "supply_phase";--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_sanctioned_load_above_zero" CHECK ("lead"."sanctioned_load_kw" > 0);--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_site_district_has_its_area" CHECK ("lead"."site_district" is null or "lead"."site_area" is not null);--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "proposal_version_id" uuid;--> statement-breakpoint
ALTER TABLE "proposal_template_settings" ADD COLUMN "cover_picture" jsonb;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_duplicated_from_proposal_id_fk" FOREIGN KEY ("duplicated_from") REFERENCES "public"."proposal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_share" ADD CONSTRAINT "proposal_share_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_share" ADD CONSTRAINT "proposal_share_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_share" ADD CONSTRAINT "proposal_share_shared_by_user_account_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_version" ADD CONSTRAINT "proposal_version_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_version" ADD CONSTRAINT "proposal_version_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_version" ADD CONSTRAINT "proposal_version_generated_by_user_account_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_part" ADD CONSTRAINT "saved_part_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_part" ADD CONSTRAINT "saved_part_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_part" ADD CONSTRAINT "saved_part_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_proposal_version_id_proposal_version_id_fk" FOREIGN KEY ("proposal_version_id") REFERENCES "public"."proposal_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proposal_tenant_lead_idx" ON "proposal" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE INDEX "proposal_tenant_status_idx" ON "proposal" USING btree ("tenant_id","status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "proposal_tenant_creator_idx" ON "proposal" USING btree ("tenant_id","created_by","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_tenant_number_key" ON "proposal" USING btree ("tenant_id","number") WHERE "proposal"."number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_one_draft_per_lead_key" ON "proposal" USING btree ("tenant_id","lead_id") WHERE "proposal"."status" = 'draft' and "proposal"."latest_version" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_tenant_creation_key" ON "proposal" USING btree ("tenant_id","creation_key") WHERE "proposal"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "proposal_share_tenant_proposal_idx" ON "proposal_share" USING btree ("tenant_id","proposal_id","shared_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_version_tenant_proposal_version_key" ON "proposal_version" USING btree ("tenant_id","proposal_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_version_tenant_creation_key" ON "proposal_version" USING btree ("tenant_id","creation_key") WHERE "proposal_version"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "saved_part_tenant_kind_idx" ON "saved_part" USING btree ("tenant_id","kind","brand");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_part_tenant_kind_match_key" ON "saved_part" USING btree ("tenant_id","kind","match_key") WHERE "saved_part"."archived_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_part_tenant_creation_key" ON "saved_part" USING btree ("tenant_id","creation_key") WHERE "saved_part"."creation_key" is not null;--> statement-breakpoint
ALTER TABLE "proposal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposal" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "proposal_tenant" ON "proposal" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "proposal" TO app_user;--> statement-breakpoint
ALTER TABLE "proposal_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposal_version" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "proposal_version_tenant" ON "proposal_version" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "proposal_version" TO app_user;--> statement-breakpoint
ALTER TABLE "proposal_share" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposal_share" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "proposal_share_tenant" ON "proposal_share" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "proposal_share" TO app_user;--> statement-breakpoint
ALTER TABLE "saved_part" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_part" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "saved_part_tenant" ON "saved_part" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "saved_part" TO app_user;--> statement-breakpoint
GRANT SELECT ON TABLE "energy_estimate" TO app_user;
