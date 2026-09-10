-- 0006 · tenant settings (T-M01-026): every setting's one home, the platform default filled in
-- domain where a tenant set nothing (M01-28, M01-53). Nine tenant-scoped tables and no settings
-- JSONB: business_profile, tax_registration, onboarding_progress, branding_settings,
-- proposal_template_settings, timeline_template, tranche_template, tranche_template_line,
-- tenant_holiday. Schema only — the tenant-creation transaction seeds one onboarding_progress
-- row, one empty business_profile and the two standard tranche templates on the admin path, and
-- every later write rides the runtime pool under the policies below.
--
-- Tenancy: all nine are TENANT-SCOPED, all four — tenant_id, a composite index leading with it,
-- a fail-closed policy for app_user, explicit grants. A one-per-tenant setting carries a UNIQUE
-- key on tenant_id alone, so a save is an upsert and two rows can never disagree. DELETE is held
-- only where a setting is a LIST replaced whole (tax_registration, tenant_holiday) or a template's
-- lines rewritten on save (tranche_template_line); a template itself is archived, never deleted.
--
-- tranche_template_tenant_default_key is a PARTIAL unique index on tenant_id where is_default:
-- exactly one default per tenant, held by the database rather than by a promise. It leads with
-- tenant_id like every unique key here, so the tenancy scan needs no exemption.
--
-- due_on_stage is text: it validates against domain's PROJECT_STAGES (M08-08's chain) until
-- M08's slice mirrors the tuple as its pgEnum (Law 9). Percentages are whole basis points, so
-- the 100.00 rule is exact integer arithmetic (M01-54).
--
-- The audit vocabulary grows with the slice that performs the act (Law 9): the ten settings
-- writes F2-22 names, and the subjects they act on — the setting rows, and the tenant itself for
-- a setting that is a whole list rather than a row (its holidays).

ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.business_profile_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.tax_registrations_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.branding_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.proposal_template_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.timeline_template_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.tranche_template_created';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.tranche_template_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.tranche_template_archived';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.tranche_template_default_changed';ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.holidays_changed';ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'business_profile';ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'branding_settings';ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'proposal_template_settings';ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'timeline_template';ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'tranche_template';ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'tenant';CREATE TABLE "branding_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"brand_colour" text,
	"letterhead" jsonb,
	"updated_at" timestamp with time zone NOT NULL
);
CREATE TABLE "business_profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"address" text,
	"bank_details" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
CREATE TABLE "onboarding_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"resume_step" text,
	"step_states" jsonb NOT NULL,
	"prompt_point_states" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
CREATE TABLE "proposal_template_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cover" jsonb,
	"sections_included" text[] NOT NULL,
	"default_terms" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
CREATE TABLE "tax_registration" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"registration_type" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
CREATE TABLE "tenant_holiday" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"date" date NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
CREATE TABLE "timeline_template" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phases" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
CREATE TABLE "tranche_template" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"is_default" boolean NOT NULL,
	"archived" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"changed_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
CREATE TABLE "tranche_template_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tranche_template_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"label" jsonb NOT NULL,
	"share_basis_points" integer NOT NULL,
	"due_on_stage" text NOT NULL
);
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "proposal_template_settings" ADD CONSTRAINT "proposal_template_settings_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "tax_registration" ADD CONSTRAINT "tax_registration_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "tenant_holiday" ADD CONSTRAINT "tenant_holiday_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "timeline_template" ADD CONSTRAINT "timeline_template_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "tranche_template" ADD CONSTRAINT "tranche_template_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "tranche_template_line" ADD CONSTRAINT "tranche_template_line_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;ALTER TABLE "tranche_template_line" ADD CONSTRAINT "tranche_template_line_tranche_template_id_tranche_template_id_fk" FOREIGN KEY ("tranche_template_id") REFERENCES "public"."tranche_template"("id") ON DELETE no action ON UPDATE no action;CREATE UNIQUE INDEX "branding_settings_tenant_key" ON "branding_settings" USING btree ("tenant_id");CREATE UNIQUE INDEX "business_profile_tenant_key" ON "business_profile" USING btree ("tenant_id");CREATE UNIQUE INDEX "onboarding_progress_tenant_key" ON "onboarding_progress" USING btree ("tenant_id");CREATE UNIQUE INDEX "proposal_template_settings_tenant_key" ON "proposal_template_settings" USING btree ("tenant_id");CREATE UNIQUE INDEX "tax_registration_tenant_type_key" ON "tax_registration" USING btree ("tenant_id","registration_type");CREATE UNIQUE INDEX "tenant_holiday_tenant_date_key" ON "tenant_holiday" USING btree ("tenant_id","date");CREATE UNIQUE INDEX "timeline_template_tenant_key" ON "timeline_template" USING btree ("tenant_id");CREATE INDEX "tranche_template_tenant_archived_default_idx" ON "tranche_template" USING btree ("tenant_id","archived","is_default");CREATE UNIQUE INDEX "tranche_template_tenant_default_key" ON "tranche_template" USING btree ("tenant_id") WHERE "tranche_template"."is_default";CREATE UNIQUE INDEX "tranche_template_line_tenant_template_position_key" ON "tranche_template_line" USING btree ("tenant_id","tranche_template_id","position");CREATE INDEX "tranche_template_line_template_idx" ON "tranche_template_line" USING btree ("tranche_template_id");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Every policy below renders exactly as the RLS checker's canonical list.
ALTER TABLE "business_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_profile" FORCE ROW LEVEL SECURITY;
CREATE POLICY "business_profile_tenant" ON "business_profile" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "business_profile" TO app_user;

ALTER TABLE "tax_registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_registration" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tax_registration_tenant" ON "tax_registration" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tax_registration" TO app_user;

ALTER TABLE "onboarding_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_progress" FORCE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_progress_tenant" ON "onboarding_progress" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "onboarding_progress" TO app_user;

ALTER TABLE "branding_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "branding_settings" FORCE ROW LEVEL SECURITY;
CREATE POLICY "branding_settings_tenant" ON "branding_settings" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "branding_settings" TO app_user;

ALTER TABLE "proposal_template_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposal_template_settings" FORCE ROW LEVEL SECURITY;
CREATE POLICY "proposal_template_settings_tenant" ON "proposal_template_settings" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "proposal_template_settings" TO app_user;

ALTER TABLE "timeline_template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timeline_template" FORCE ROW LEVEL SECURITY;
CREATE POLICY "timeline_template_tenant" ON "timeline_template" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "timeline_template" TO app_user;

ALTER TABLE "tranche_template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tranche_template" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tranche_template_tenant" ON "tranche_template" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "tranche_template" TO app_user;

ALTER TABLE "tranche_template_line" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tranche_template_line" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tranche_template_line_tenant" ON "tranche_template_line" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tranche_template_line" TO app_user;

ALTER TABLE "tenant_holiday" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_holiday" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_holiday_tenant" ON "tenant_holiday" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tenant_holiday" TO app_user;
