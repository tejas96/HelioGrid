-- 0062 · payments (block 5, M11; owner rulings 2026-11-10 and 2026-11-11). The customer pays the
-- company straight — its own UPI ID or bank account — and a person records it: there is no payment
-- gateway, no link and no confirmation state (ruling 2026-11-11).
--
-- project_tranche holds a project's parts, made once at Mark won from the company's payment terms
-- (M11-09, M11-13, ruling 2026-11-10); their state is read from the ledger and the stage history,
-- never stored (M11-10), and a waiver is the one change (M11-49). project_payment is the ledger:
-- payments and their reversals, never edited and never deleted (M11-40, M11-46), each payment
-- numbered from the company's receipt counter. tranche_request_share records each tap that shared a
-- part's request, so nobody asks twice (ruling 2026-11-10). collections_settings is the company's
-- UPI ID and the name a UPI app shows.
--
-- Tenant-scoped, all four always. project_payment and tranche_request_share are ledgers: SELECT and
-- INSERT alone, and they join `append-only-ledgers.ts`. project_tranche and collections_settings are
-- SELECT, INSERT and UPDATE.
--
-- Additive only: new tables and types, and new values at the end of subject_kind, audit_event_type
-- and tenant_counter_kind, and after 'payment_due' in notification_type (enum-parity holds the
-- order). An older reader shows an unknown notice as a system notice; no older code writes or reads
-- the new tables. The new enum values are not used in this transaction.
CREATE TYPE "public"."payment_entry_kind" AS ENUM('payment', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."schedule_source" AS ENUM('payment_terms', 'proposal_version');--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'project_tranche';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'project_payment';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'collections_settings';--> statement-breakpoint
ALTER TYPE "public"."tenant_counter_kind" ADD VALUE 'receipt';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payment_recorded' BEFORE 'lead_unassigned_24h';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payment_reversed' BEFORE 'lead_unassigned_24h';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'payments.payment_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'payments.payment_reversed';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'payments.tranche_waived';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'payments.request_shared';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.collections_changed';--> statement-breakpoint
CREATE TABLE "collections_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"upi_id" text,
	"payee_name" text,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL
);--> statement-breakpoint
CREATE TABLE "project_payment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"tranche_id" uuid NOT NULL,
	"kind" "payment_entry_kind" NOT NULL,
	"amount_minor" bigint NOT NULL,
	"mode" text,
	"reference" text,
	"reference_key" text,
	"received_on" date,
	"file_id" uuid,
	"receipt_number" integer,
	"reverses_id" uuid,
	"reason" text,
	"recorded_at" timestamp with time zone NOT NULL,
	"recorded_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "project_payment_is_whole" CHECK (("project_payment"."kind" = 'payment' and "project_payment"."amount_minor" > 0 and "project_payment"."mode" is not null and "project_payment"."received_on" is not null and "project_payment"."receipt_number" is not null and "project_payment"."reverses_id" is null)
        or ("project_payment"."kind" = 'reversal' and "project_payment"."amount_minor" < 0 and "project_payment"."reverses_id" is not null and "project_payment"."reason" is not null and "project_payment"."receipt_number" is null)),
	CONSTRAINT "project_payment_reference_has_its_key" CHECK (("project_payment"."reference" is null) = ("project_payment"."reference_key" is null))
);--> statement-breakpoint
CREATE TABLE "project_tranche" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"label" text NOT NULL,
	"share_basis_points" integer NOT NULL,
	"amount_minor" bigint NOT NULL,
	"due_on_stage" "project_stage" NOT NULL,
	"source" "schedule_source" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"waived_at" timestamp with time zone,
	"waived_by" uuid,
	"waive_reason" text,
	CONSTRAINT "project_tranche_position_counts" CHECK ("project_tranche"."position" >= 1),
	CONSTRAINT "project_tranche_share_is_a_share" CHECK ("project_tranche"."share_basis_points" between 0 and 10000),
	CONSTRAINT "project_tranche_amount_not_negative" CHECK ("project_tranche"."amount_minor" >= 0),
	CONSTRAINT "project_tranche_due_on_a_chain_stage" CHECK ("project_tranche"."due_on_stage" <> 'cancelled'),
	CONSTRAINT "project_tranche_waiver_is_whole" CHECK (("project_tranche"."waived_at" is null) = ("project_tranche"."waived_by" is null) and ("project_tranche"."waived_at" is null) = ("project_tranche"."waive_reason" is null))
);--> statement-breakpoint
CREATE TABLE "tranche_request_share" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tranche_id" uuid NOT NULL,
	"shared_at" timestamp with time zone NOT NULL,
	"shared_by" uuid NOT NULL
);--> statement-breakpoint
ALTER TABLE "project_payment" ADD CONSTRAINT "project_payment_reverses_id_project_payment_id_fk" FOREIGN KEY ("reverses_id") REFERENCES "public"."project_payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections_settings" ADD CONSTRAINT "collections_settings_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections_settings" ADD CONSTRAINT "collections_settings_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_payment" ADD CONSTRAINT "project_payment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_payment" ADD CONSTRAINT "project_payment_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_payment" ADD CONSTRAINT "project_payment_tranche_id_project_tranche_id_fk" FOREIGN KEY ("tranche_id") REFERENCES "public"."project_tranche"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_payment" ADD CONSTRAINT "project_payment_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_payment" ADD CONSTRAINT "project_payment_recorded_by_user_account_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tranche" ADD CONSTRAINT "project_tranche_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tranche" ADD CONSTRAINT "project_tranche_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tranche" ADD CONSTRAINT "project_tranche_waived_by_user_account_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tranche_request_share" ADD CONSTRAINT "tranche_request_share_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tranche_request_share" ADD CONSTRAINT "tranche_request_share_tranche_id_project_tranche_id_fk" FOREIGN KEY ("tranche_id") REFERENCES "public"."project_tranche"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tranche_request_share" ADD CONSTRAINT "tranche_request_share_shared_by_user_account_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_payment_tenant_project_idx" ON "project_payment" USING btree ("tenant_id","project_id","recorded_at");--> statement-breakpoint
CREATE INDEX "project_payment_tenant_reference_idx" ON "project_payment" USING btree ("tenant_id","reference_key") WHERE "project_payment"."reference_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_payment_one_reversal_key" ON "project_payment" USING btree ("tenant_id","reverses_id") WHERE "project_payment"."reverses_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_payment_tenant_receipt_key" ON "project_payment" USING btree ("tenant_id","receipt_number") WHERE "project_payment"."receipt_number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_payment_tenant_creation_key" ON "project_payment" USING btree ("tenant_id","creation_key") WHERE "project_payment"."creation_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_tranche_tenant_project_position_key" ON "project_tranche" USING btree ("tenant_id","project_id","position");--> statement-breakpoint
CREATE INDEX "tranche_request_share_tenant_tranche_idx" ON "tranche_request_share" USING btree ("tenant_id","tranche_id","shared_at");--> statement-breakpoint
ALTER TABLE "project_tranche" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_tranche" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_tranche_tenant" ON "project_tranche" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "project_tranche" TO app_user;--> statement-breakpoint
ALTER TABLE "project_payment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_payment" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_payment_tenant" ON "project_payment" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "project_payment" TO app_user;--> statement-breakpoint
ALTER TABLE "tranche_request_share" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tranche_request_share" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tranche_request_share_tenant" ON "tranche_request_share" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "tranche_request_share" TO app_user;--> statement-breakpoint
ALTER TABLE "collections_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "collections_settings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collections_settings_tenant" ON "collections_settings" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "collections_settings" TO app_user;
