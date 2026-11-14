-- 0066 · the customer's link (block 8, F5; owner rulings 2026-08-04 and 2026-11-13). One link per
-- person per deal, for life: `customer_link` holds the lead, the label and the scopes; `link_token`
-- holds each address as the hash of its secret, individually revocable; `link_event` is what
-- happened on it — opened, a section viewed, an answer — with a device class and never a network
-- address; `acceptance_record` is written once at Accept, one per version, with that moment's full
-- attribution. `customer_question` and `callback_request` are the customer's question and their
-- recorded consent to be called.
--
-- The project gains the installation day's facts the customer is told, and its crew a lead
-- (F5-68, T-F5-002): all null or false, so a project won before this reads as not yet scheduled.
--
-- Tenant-scoped, all four always. `link_event`, `acceptance_record`, `customer_question` and
-- `callback_request` are ledgers: SELECT and INSERT alone, and they join `append-only-ledgers.ts`.
-- `customer_link` and `link_token` take UPDATE for the label and the revoke.
-- `project_crew_member` takes UPDATE now, for the lead's mark.
--
-- Additive only: new tables and types, new nullable or defaulted columns, and new values in
-- audit_actor_kind, audit_event_type, subject_kind, task_provenance, activity_kind (before
-- 'proposal_version_in_force', as domain orders them) and notification_type (before 'system'). An older reader shows an unknown notice as a system notice. The
-- new enum values are not used in this transaction.
CREATE TYPE "public"."acceptance_challenge" AS ENUM('off', 'satisfied');--> statement-breakpoint
CREATE TYPE "public"."device_class" AS ENUM('phone', 'tablet', 'desktop', 'other');--> statement-breakpoint
CREATE TYPE "public"."link_event_type" AS ENUM('opened', 'section_viewed', 'accepted', 'negotiate_requested', 'declined');--> statement-breakpoint
CREATE TYPE "public"."link_phase" AS ENUM('proposal', 'progress', 'handover');--> statement-breakpoint
CREATE TYPE "public"."link_scope" AS ENUM('view_proposal', 'respond', 'view_progress', 'view_handover_pack');--> statement-breakpoint
CREATE TYPE "public"."link_section" AS ENUM('price', 'savings', 'generation', 'parts', 'payment', 'timeline', 'terms');--> statement-breakpoint
CREATE TYPE "public"."link_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_opened' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_accepted' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_negotiation_requested' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'proposal_declined' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'customer_question' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'customer_call_requested' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'customer_link_changed' BEFORE 'proposal_version_in_force';--> statement-breakpoint
ALTER TYPE "public"."audit_actor_kind" ADD VALUE 'customer_link';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.minted';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.reminted';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.revoked';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.opened';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.accepted';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.negotiation_requested';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer_link.declined';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'proposal_accepted' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'proposal_declined' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'negotiation_requested' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'customer_question' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'customer_call_requested' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'customer_link';--> statement-breakpoint
ALTER TYPE "public"."task_provenance" ADD VALUE 'customer_question';--> statement-breakpoint
ALTER TYPE "public"."task_provenance" ADD VALUE 'customer_call_request';--> statement-breakpoint
CREATE TABLE "acceptance_record" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"token_id" uuid NOT NULL,
	"contact_id" uuid,
	"proposal_id" uuid NOT NULL,
	"proposal_version_id" uuid NOT NULL,
	"challenge" "acceptance_challenge" NOT NULL,
	"network_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"accepted_at" timestamp with time zone NOT NULL
);--> statement-breakpoint
CREATE TABLE "callback_request" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"phase" "link_phase" NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"named_at" timestamp with time zone,
	"due_at" timestamp with time zone NOT NULL,
	"task_id" uuid
);--> statement-breakpoint
CREATE TABLE "customer_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"contact_id" uuid,
	"label" text NOT NULL,
	"status" "link_status" NOT NULL,
	"scopes" "link_scope"[] NOT NULL,
	"minted_at" timestamp with time zone NOT NULL,
	"minted_by" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "customer_link_label_given" CHECK (char_length(btrim("customer_link"."label")) >= 1),
	CONSTRAINT "customer_link_scopes_given" CHECK (cardinality("customer_link"."scopes") >= 1),
	CONSTRAINT "customer_link_revoke_is_whole" CHECK (("customer_link"."status" = 'revoked') = ("customer_link"."revoked_at" is not null) and ("customer_link"."revoked_at" is null) = ("customer_link"."revoked_by" is null))
);--> statement-breakpoint
CREATE TABLE "customer_question" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"phase" "link_phase" NOT NULL,
	"question_text" text NOT NULL,
	"asked_at" timestamp with time zone NOT NULL,
	"task_id" uuid,
	CONSTRAINT "customer_question_words_given" CHECK (char_length(btrim("customer_question"."question_text")) >= 1)
);--> statement-breakpoint
CREATE TABLE "link_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"event_type" "link_event_type" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"proposal_version" integer,
	"device_class" "device_class",
	"section" "link_section",
	"duration_seconds" integer,
	"words" text,
	CONSTRAINT "link_event_open_names_its_device" CHECK (("link_event"."event_type" = 'opened') = ("link_event"."device_class" is not null)),
	CONSTRAINT "link_event_view_is_whole" CHECK (("link_event"."event_type" = 'section_viewed') = ("link_event"."section" is not null) and ("link_event"."section" is null) = ("link_event"."duration_seconds" is null) and "link_event"."duration_seconds" > 0),
	CONSTRAINT "link_event_answer_names_its_version" CHECK ("link_event"."event_type" not in ('accepted', 'negotiate_requested', 'declined') or "link_event"."proposal_version" is not null),
	CONSTRAINT "link_event_words_only_on_an_answer" CHECK ("link_event"."words" is null or "link_event"."event_type" in ('negotiate_requested', 'declined'))
);--> statement-breakpoint
CREATE TABLE "link_token" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"minted_at" timestamp with time zone NOT NULL,
	"minted_by" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	CONSTRAINT "link_token_revoke_is_whole" CHECK (("link_token"."revoked_at" is null) = ("link_token"."revoked_by" is null))
);--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "install_start_minutes" smallint;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "install_duration_days" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "install_disturbance" text;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_install_start_is_a_time" CHECK ("project"."install_start_minutes" between 0 and 1439);--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_install_duration_above_zero" CHECK ("project"."install_duration_days" > 0);--> statement-breakpoint
ALTER TABLE "project_crew_member" ADD COLUMN "is_lead" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "acceptance_record" ADD CONSTRAINT "acceptance_record_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_record" ADD CONSTRAINT "acceptance_record_link_id_customer_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."customer_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_record" ADD CONSTRAINT "acceptance_record_token_id_link_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."link_token"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_record" ADD CONSTRAINT "acceptance_record_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_record" ADD CONSTRAINT "acceptance_record_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_record" ADD CONSTRAINT "acceptance_record_proposal_version_id_proposal_version_id_fk" FOREIGN KEY ("proposal_version_id") REFERENCES "public"."proposal_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callback_request" ADD CONSTRAINT "callback_request_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callback_request" ADD CONSTRAINT "callback_request_link_id_customer_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."customer_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callback_request" ADD CONSTRAINT "callback_request_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callback_request" ADD CONSTRAINT "callback_request_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_link" ADD CONSTRAINT "customer_link_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_link" ADD CONSTRAINT "customer_link_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_link" ADD CONSTRAINT "customer_link_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_link" ADD CONSTRAINT "customer_link_minted_by_user_account_id_fk" FOREIGN KEY ("minted_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_link" ADD CONSTRAINT "customer_link_revoked_by_user_account_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_question" ADD CONSTRAINT "customer_question_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_question" ADD CONSTRAINT "customer_question_link_id_customer_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."customer_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_question" ADD CONSTRAINT "customer_question_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_question" ADD CONSTRAINT "customer_question_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_event" ADD CONSTRAINT "link_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_event" ADD CONSTRAINT "link_event_link_id_customer_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."customer_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_token" ADD CONSTRAINT "link_token_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_token" ADD CONSTRAINT "link_token_link_id_customer_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."customer_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_token" ADD CONSTRAINT "link_token_minted_by_user_account_id_fk" FOREIGN KEY ("minted_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_token" ADD CONSTRAINT "link_token_revoked_by_user_account_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acceptance_record_tenant_proposal_idx" ON "acceptance_record" USING btree ("tenant_id","proposal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "acceptance_record_one_per_version_key" ON "acceptance_record" USING btree ("tenant_id","proposal_version_id");--> statement-breakpoint
CREATE INDEX "callback_request_tenant_link_idx" ON "callback_request" USING btree ("tenant_id","link_id","requested_at");--> statement-breakpoint
CREATE INDEX "customer_link_tenant_lead_idx" ON "customer_link" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_link_one_per_contact_key" ON "customer_link" USING btree ("tenant_id","lead_id","contact_id") WHERE "customer_link"."status" = 'active' and "customer_link"."contact_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_link_one_for_the_customer_key" ON "customer_link" USING btree ("tenant_id","lead_id") WHERE "customer_link"."status" = 'active' and "customer_link"."contact_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_link_tenant_creation_key" ON "customer_link" USING btree ("tenant_id","creation_key") WHERE "customer_link"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "customer_question_tenant_link_idx" ON "customer_question" USING btree ("tenant_id","link_id","asked_at");--> statement-breakpoint
CREATE INDEX "link_event_tenant_link_idx" ON "link_event" USING btree ("tenant_id","link_id","occurred_at");--> statement-breakpoint
CREATE INDEX "link_token_tenant_link_idx" ON "link_token" USING btree ("tenant_id","link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "link_token_hash_key" ON "link_token" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "project_crew_member_one_lead_key" ON "project_crew_member" USING btree ("tenant_id","project_id") WHERE "project_crew_member"."is_lead";--> statement-breakpoint
ALTER TABLE "customer_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_link" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "customer_link_tenant" ON "customer_link" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "customer_link" TO app_user;--> statement-breakpoint
ALTER TABLE "link_token" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "link_token" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "link_token_tenant" ON "link_token" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "link_token" TO app_user;--> statement-breakpoint
ALTER TABLE "link_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "link_event" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "link_event_tenant" ON "link_event" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "link_event" TO app_user;--> statement-breakpoint
ALTER TABLE "acceptance_record" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "acceptance_record" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "acceptance_record_tenant" ON "acceptance_record" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "acceptance_record" TO app_user;--> statement-breakpoint
ALTER TABLE "customer_question" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_question" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "customer_question_tenant" ON "customer_question" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "customer_question" TO app_user;--> statement-breakpoint
ALTER TABLE "callback_request" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "callback_request" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "callback_request_tenant" ON "callback_request" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "callback_request" TO app_user;--> statement-breakpoint
GRANT UPDATE ON TABLE "project_crew_member" TO app_user;
