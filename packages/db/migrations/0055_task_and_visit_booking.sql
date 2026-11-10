-- 0055 · follow-up tasks and the site-visit booking (T-M02-010, T-M02-013, T-M02-014; RFC decision
-- 8): two tenant tables and three pgEnums.
--
-- task is M07-05's model, built here once (decision 8): an assignee, a kind, a due time and a status
-- `open | done | cancelled`; overdue is derived from the due time and never stored. Every automatic
-- task names the rule that raised it (M07-06) and lands on a named person, never a pool; a manual
-- task names the person who raised it. A custom task carries its own words. A task may stand on a
-- lead or alone.
--
-- lead_visit_booking is the lead-side record of the booking act (M02-46): date and time, surveyor,
-- confirmed address. A reschedule books a new row naming the booking it replaces — set once, at the
-- insert — and a booking is replaced at most once. The one reminder a visit may have (M02-48) is the
-- moment it was composed, set once where it is still null. The visit object itself is M04's (V2).
--
-- Tenant-scoped, all four always. SELECT, INSERT and UPDATE for app_user on both: a task is done or
-- cancelled, a booking gets its reminder and its no-show. No DELETE: a cancelled task
-- and a moved visit are kept.
--
-- Additive only: new tables and new types nothing older reads.
CREATE TYPE "public"."task_kind" AS ENUM('follow_up', 'site_visit', 'call', 'custom');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_provenance" AS ENUM('manual', 'call_back_window', 'retry_after_no_answer', 'snooze_wake', 'resurface', 'visit_booked');--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid,
	"assignee_user_id" uuid NOT NULL,
	"kind" "task_kind" NOT NULL,
	"title" text,
	"due_at" timestamp with time zone NOT NULL,
	"status" "task_status" NOT NULL,
	"provenance" "task_provenance" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "task_manual_names_its_raiser" CHECK ("task"."provenance" <> 'manual' or "task"."created_by" is not null),
	CONSTRAINT "task_custom_has_words" CHECK ("task"."kind" <> 'custom' or coalesce(char_length(btrim("task"."title")), 0) >= 1),
	CONSTRAINT "task_done_has_moment" CHECK (("task"."status" = 'done') = ("task"."done_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "lead_visit_booking" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"surveyor_user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"rescheduled_from_id" uuid,
	"reminder_composed_at" timestamp with time zone,
	"no_show_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "lead_visit_booking_address_given" CHECK (char_length(btrim("lead_visit_booking"."address")) >= 1),
	CONSTRAINT "lead_visit_booking_never_replaces_itself" CHECK ("lead_visit_booking"."rescheduled_from_id" <> "lead_visit_booking"."id")
);
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_user_id_user_account_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_done_by_user_account_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" ADD CONSTRAINT "lead_visit_booking_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" ADD CONSTRAINT "lead_visit_booking_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" ADD CONSTRAINT "lead_visit_booking_surveyor_user_id_user_account_id_fk" FOREIGN KEY ("surveyor_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" ADD CONSTRAINT "lead_visit_booking_rescheduled_from_id_lead_visit_booking_id_fk" FOREIGN KEY ("rescheduled_from_id") REFERENCES "public"."lead_visit_booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" ADD CONSTRAINT "lead_visit_booking_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_tenant_assignee_status_due_idx" ON "task" USING btree ("tenant_id","assignee_user_id","status","due_at");--> statement-breakpoint
CREATE INDEX "task_tenant_lead_idx" ON "task" USING btree ("tenant_id","lead_id") WHERE "task"."lead_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "task_tenant_creation_key" ON "task" USING btree ("tenant_id","creation_key") WHERE "task"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "lead_visit_booking_tenant_lead_idx" ON "lead_visit_booking" USING btree ("tenant_id","lead_id","scheduled_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "lead_visit_booking_tenant_surveyor_idx" ON "lead_visit_booking" USING btree ("tenant_id","surveyor_user_id","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_visit_booking_tenant_rescheduled_from_key" ON "lead_visit_booking" USING btree ("tenant_id","rescheduled_from_id") WHERE "lead_visit_booking"."rescheduled_from_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_visit_booking_tenant_creation_key" ON "lead_visit_booking" USING btree ("tenant_id","creation_key") WHERE "lead_visit_booking"."creation_key" is not null;--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "task" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "task_tenant" ON "task" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "task" TO app_user;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_visit_booking" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_visit_booking_tenant" ON "lead_visit_booking" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "lead_visit_booking" TO app_user;
