-- 0053 · a lead's two histories (T-M02-011, T-M02-015; RFC decisions 6, 10): two append-only
-- tenant ledgers and two pgEnums — every funnel or R9 move, and every assignment.
--
-- lead_stage_transition is domain's `LeadTransition`, one row per move: move_kind says which machine
-- moved, and the pair it moved is typed by that machine's own enum — a funnel move names both
-- stages, an R9 move names the state before and after (null is an active lead). M13's time-in-stage
-- reads the funnel rows alone, so a parking spell is never counted as a stage (M13-22, M13-24). A
-- reopen is a new row, never a rewrite of the close (M02-56). moved_by is null for the sweep's own
-- moves (a wake, a dormant flag, a resurface).
--
-- lead_assignment records who assigned whom, when, and the assignee's open count at that moment
-- (M02-30); a reassignment's reason is its own column.
--
-- Tenant-scoped, all four always. SELECT and INSERT ALONE for app_user on both — no role holds
-- UPDATE, DELETE or TRUNCATE — and both join `append-only-ledgers.ts`. Neither is re-pointed by a
-- merge: each keys a lead, and a merge re-points the lead's customer, never the lead.
--
-- Additive only: new tables and new types nothing older reads.
CREATE TYPE "public"."lead_move_kind" AS ENUM('funnel_stage', 'lifecycle_state');--> statement-breakpoint
CREATE TYPE "public"."transition_cause" AS ENUM('manual', 'import', 'automation', 'wake', 'reopen', 'merge');--> statement-breakpoint
CREATE TABLE "lead_stage_transition" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"move_kind" "lead_move_kind" NOT NULL,
	"from_stage" "lead_stage",
	"to_stage" "lead_stage",
	"from_state" "lead_lifecycle_state",
	"to_state" "lead_lifecycle_state",
	"cause" "transition_cause" NOT NULL,
	"moved_at" timestamp with time zone NOT NULL,
	"moved_by" uuid,
	CONSTRAINT "lead_stage_transition_moves_its_own_pair" CHECK (("lead_stage_transition"."move_kind" = 'funnel_stage' and "lead_stage_transition"."from_stage" is not null and "lead_stage_transition"."to_stage" is not null and "lead_stage_transition"."from_stage" <> "lead_stage_transition"."to_stage" and "lead_stage_transition"."from_state" is null and "lead_stage_transition"."to_state" is null) or ("lead_stage_transition"."move_kind" = 'lifecycle_state' and "lead_stage_transition"."from_stage" is null and "lead_stage_transition"."to_stage" is null and "lead_stage_transition"."from_state" is distinct from "lead_stage_transition"."to_state"))
);
--> statement-breakpoint
CREATE TABLE "lead_assignment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"assigned_to" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	"open_count_snapshot" integer NOT NULL,
	"reason" text,
	CONSTRAINT "lead_assignment_open_count_not_negative" CHECK ("lead_assignment"."open_count_snapshot" >= 0)
);
--> statement-breakpoint
ALTER TABLE "lead_stage_transition" ADD CONSTRAINT "lead_stage_transition_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_transition" ADD CONSTRAINT "lead_stage_transition_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_transition" ADD CONSTRAINT "lead_stage_transition_moved_by_user_account_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_assigned_to_user_account_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_assigned_by_user_account_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_stage_transition_tenant_lead_idx" ON "lead_stage_transition" USING btree ("tenant_id","lead_id","moved_at");--> statement-breakpoint
CREATE INDEX "lead_assignment_tenant_lead_idx" ON "lead_assignment" USING btree ("tenant_id","lead_id","assigned_at");--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
-- The ledgers: SELECT and INSERT alone — no role holds UPDATE or DELETE.
ALTER TABLE "lead_stage_transition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_stage_transition" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_stage_transition_tenant" ON "lead_stage_transition" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "lead_stage_transition" TO app_user;--> statement-breakpoint
ALTER TABLE "lead_assignment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_assignment" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_assignment_tenant" ON "lead_assignment" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "lead_assignment" TO app_user;
