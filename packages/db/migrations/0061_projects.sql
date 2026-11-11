-- 0061 · projects (block 4, M08 and M07-62's Mark won; owner rulings 2026-11-10). A won deal is a
-- project (M08-02): Mark won creates it, with its number from the company's own counter (M08-03),
-- its checklist and install steps seeded once from the pack (M08-05, M08-41).
--
-- project is the board's current position; project_stage_transition is the append-only history of
-- every move (M08-14). project_blocker holds the waits — one open at a time — with the reason class
-- the customer link may say and the internal note it never publishes (M08-25). project_document is
-- the checklist (done / not needed + reason, no verify step), project_install_step the ticks,
-- project_crew_member the installers' whole reach, project_file and lead_file the files on each.
-- tenant_counter is the company's number series.
--
-- Tenant-scoped, all four always. project_stage_transition is a ledger: SELECT and INSERT alone, and
-- it joins `append-only-ledgers.ts`; so is lead_file. A crew is replaced by delete and insert; every
-- other table is SELECT, INSERT and UPDATE. Nothing here is ever deleted save a crew pick.
--
-- Additive only: new tables and types, and new values at the end of activity_kind and subject_kind,
-- and before 'system' in notification_type (enum-parity holds the order). An older reader shows an
-- unknown timeline kind as a plain system entry; no older code writes or reads the new tables.
-- The new enum values are not used in this transaction.
CREATE TYPE "public"."blocker_clear" AS ENUM('person', 'stage_move', 'cancel');--> statement-breakpoint
CREATE TYPE "public"."blocker_party" AS ENUM('company', 'customer', 'utility', 'material');--> statement-breakpoint
CREATE TYPE "public"."blocker_reason" AS ENUM('crew_availability', 'internal_paperwork', 'site_access', 'customer_documents', 'customer_payment', 'customer_decision', 'utility_approval', 'utility_inspection', 'utility_meter', 'incentive_rejected', 'incentive_payout', 'material_supply', 'material_transport', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_document_state" AS ENUM('pending', 'done', 'not_needed');--> statement-breakpoint
CREATE TYPE "public"."project_file_slot" AS ENUM('document', 'step', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_cancel_reason" AS ENUM('customer_backed_out', 'won_by_mistake', 'site_not_suitable', 'lost_to_another_company', 'something_else');--> statement-breakpoint
CREATE TYPE "public"."project_move_cause" AS ENUM('person', 'proof', 'handover', 'cancel', 'undo');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('won', 'material_ordered', 'dispatched', 'installation', 'electrical_metering', 'utility_inspection', 'commissioned', 'incentive_claimed', 'handed_over', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tenant_counter_kind" AS ENUM('project');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'project_moved' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'project';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'project_moved';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'project_wait';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'project_document';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'project_step';--> statement-breakpoint
ALTER TYPE "public"."activity_kind" ADD VALUE 'project_changed';--> statement-breakpoint
CREATE TABLE "lead_file" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"name" text NOT NULL,
	"added_at" timestamp with time zone NOT NULL,
	"added_by" uuid NOT NULL
);--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"lead_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"stage" "project_stage" NOT NULL,
	"stage_entered_at" timestamp with time zone NOT NULL,
	"manager_id" uuid NOT NULL,
	"sold_by" uuid,
	"expected_install_on" date,
	"final_value_minor" bigint NOT NULL,
	"pack_version" text NOT NULL,
	"incentive_applies" boolean NOT NULL,
	"access_note" text,
	"cancel_reason" "project_cancel_reason",
	"cancel_note" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"pack_left_out" smallint,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "project_number_positive" CHECK ("project"."number" >= 1),
	CONSTRAINT "project_final_value_positive" CHECK ("project"."final_value_minor" > 0),
	CONSTRAINT "project_pack_left_out_counts" CHECK ("project"."pack_left_out" >= 0),
	CONSTRAINT "project_cancel_is_whole" CHECK (("project"."stage" = 'cancelled') = ("project"."cancel_reason" is not null) and ("project"."cancel_reason" is null) = ("project"."cancelled_at" is null) and ("project"."cancelled_at" is null) = ("project"."cancelled_by" is null)),
	CONSTRAINT "project_cancel_something_else_is_said" CHECK ("project"."cancel_reason" is distinct from 'something_else' or "project"."cancel_note" is not null)
);--> statement-breakpoint
CREATE TABLE "project_blocker" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"party" "blocker_party" NOT NULL,
	"reason" "blocker_reason" NOT NULL,
	"note" text,
	"started_on" date NOT NULL,
	"expected_until" date,
	"opened_at" timestamp with time zone NOT NULL,
	"opened_by" uuid NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by" uuid,
	"ended_as" "blocker_clear",
	CONSTRAINT "project_blocker_end_is_whole" CHECK (("project_blocker"."ended_at" is null) = ("project_blocker"."ended_as" is null) and ("project_blocker"."ended_as" is distinct from 'person' or "project_blocker"."ended_by" is not null))
);--> statement-breakpoint
CREATE TABLE "project_crew_member" (
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"added_at" timestamp with time zone NOT NULL,
	"added_by" uuid NOT NULL,
	CONSTRAINT "project_crew_member_pkey" PRIMARY KEY("project_id","user_id")
);--> statement-breakpoint
CREATE TABLE "project_document" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"row_key" text NOT NULL,
	"position" integer NOT NULL,
	"state" "project_document_state" NOT NULL,
	"reason" text,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid,
	CONSTRAINT "project_document_reason_when_not_needed" CHECK (("project_document"."state" = 'not_needed') = ("project_document"."reason" is not null))
);--> statement-breakpoint
CREATE TABLE "project_file" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"slot" "project_file_slot" NOT NULL,
	"slot_key" text,
	"name" text NOT NULL,
	"shown_to_customer" boolean DEFAULT false NOT NULL,
	"added_at" timestamp with time zone NOT NULL,
	"added_by" uuid NOT NULL,
	CONSTRAINT "project_file_slot_key" CHECK (("project_file"."slot" = 'other') = ("project_file"."slot_key" is null))
);--> statement-breakpoint
CREATE TABLE "project_install_step" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"position" integer NOT NULL,
	"ticked_at" timestamp with time zone,
	"ticked_by" uuid,
	"done_by" text,
	CONSTRAINT "project_install_step_tick_is_whole" CHECK (("project_install_step"."ticked_at" is null) = ("project_install_step"."ticked_by" is null))
);--> statement-breakpoint
CREATE TABLE "project_stage_transition" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"from_stage" "project_stage",
	"to_stage" "project_stage" NOT NULL,
	"cause" "project_move_cause" NOT NULL,
	"proof" text,
	"moved_at" timestamp with time zone NOT NULL,
	"entered_on" date NOT NULL,
	"moved_by" uuid,
	CONSTRAINT "project_stage_transition_moves" CHECK ("project_stage_transition"."from_stage" is distinct from "project_stage_transition"."to_stage")
);--> statement-breakpoint
CREATE TABLE "tenant_counter" (
	"tenant_id" uuid NOT NULL,
	"kind" "tenant_counter_kind" NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "tenant_counter_pkey" PRIMARY KEY("tenant_id","kind"),
	CONSTRAINT "tenant_counter_last_number_counted" CHECK ("tenant_counter"."last_number" >= 0)
);--> statement-breakpoint
ALTER TABLE "lead_file" ADD CONSTRAINT "lead_file_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_file" ADD CONSTRAINT "lead_file_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_file" ADD CONSTRAINT "lead_file_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_file" ADD CONSTRAINT "lead_file_added_by_user_account_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_manager_id_user_account_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_sold_by_user_account_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_cancelled_by_user_account_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_blocker" ADD CONSTRAINT "project_blocker_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_blocker" ADD CONSTRAINT "project_blocker_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_blocker" ADD CONSTRAINT "project_blocker_opened_by_user_account_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_blocker" ADD CONSTRAINT "project_blocker_ended_by_user_account_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_crew_member" ADD CONSTRAINT "project_crew_member_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_crew_member" ADD CONSTRAINT "project_crew_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_crew_member" ADD CONSTRAINT "project_crew_member_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_crew_member" ADD CONSTRAINT "project_crew_member_added_by_user_account_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_document" ADD CONSTRAINT "project_document_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_document" ADD CONSTRAINT "project_document_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_document" ADD CONSTRAINT "project_document_changed_by_user_account_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_added_by_user_account_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_install_step" ADD CONSTRAINT "project_install_step_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_install_step" ADD CONSTRAINT "project_install_step_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_install_step" ADD CONSTRAINT "project_install_step_ticked_by_user_account_id_fk" FOREIGN KEY ("ticked_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_transition" ADD CONSTRAINT "project_stage_transition_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_transition" ADD CONSTRAINT "project_stage_transition_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_transition" ADD CONSTRAINT "project_stage_transition_moved_by_user_account_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_counter" ADD CONSTRAINT "tenant_counter_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_file_tenant_lead_idx" ON "lead_file" USING btree ("tenant_id","lead_id","added_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_file_tenant_file_key" ON "lead_file" USING btree ("tenant_id","file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_tenant_number_key" ON "project" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "project_tenant_creation_key" ON "project" USING btree ("tenant_id","creation_key") WHERE "project"."creation_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "project_tenant_lead_key" ON "project" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE INDEX "project_tenant_stage_idx" ON "project" USING btree ("tenant_id","stage","stage_entered_at");--> statement-breakpoint
CREATE INDEX "project_tenant_manager_idx" ON "project" USING btree ("tenant_id","manager_id");--> statement-breakpoint
CREATE INDEX "project_tenant_sold_by_idx" ON "project" USING btree ("tenant_id","sold_by");--> statement-breakpoint
CREATE INDEX "project_blocker_tenant_project_idx" ON "project_blocker" USING btree ("tenant_id","project_id","opened_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_blocker_one_open" ON "project_blocker" USING btree ("tenant_id","project_id") WHERE "project_blocker"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "project_crew_member_tenant_user_idx" ON "project_crew_member" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_document_tenant_project_row_key" ON "project_document" USING btree ("tenant_id","project_id","row_key");--> statement-breakpoint
CREATE INDEX "project_file_tenant_project_idx" ON "project_file" USING btree ("tenant_id","project_id","added_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_file_tenant_file_key" ON "project_file" USING btree ("tenant_id","file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_install_step_tenant_project_step_key" ON "project_install_step" USING btree ("tenant_id","project_id","step_key");--> statement-breakpoint
CREATE INDEX "project_stage_transition_tenant_project_idx" ON "project_stage_transition" USING btree ("tenant_id","project_id","moved_at");--> statement-breakpoint
ALTER TABLE "tenant_counter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_counter" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_counter_tenant" ON "tenant_counter" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "tenant_counter" TO app_user;--> statement-breakpoint
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_tenant" ON "project" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "project" TO app_user;--> statement-breakpoint
ALTER TABLE "project_stage_transition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_stage_transition" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_stage_transition_tenant" ON "project_stage_transition" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "project_stage_transition" TO app_user;--> statement-breakpoint
ALTER TABLE "project_blocker" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_blocker" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_blocker_tenant" ON "project_blocker" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "project_blocker" TO app_user;--> statement-breakpoint
ALTER TABLE "project_document" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_document" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_document_tenant" ON "project_document" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "project_document" TO app_user;--> statement-breakpoint
ALTER TABLE "project_install_step" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_install_step" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_install_step_tenant" ON "project_install_step" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "project_install_step" TO app_user;--> statement-breakpoint
ALTER TABLE "project_crew_member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_crew_member" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_crew_member_tenant" ON "project_crew_member" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE "project_crew_member" TO app_user;--> statement-breakpoint
ALTER TABLE "project_file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_file" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_file_tenant" ON "project_file" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "project_file" TO app_user;--> statement-breakpoint
ALTER TABLE "lead_file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_file" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_file_tenant" ON "lead_file" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "lead_file" TO app_user;
