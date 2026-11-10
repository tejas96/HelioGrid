-- 0052 · the lead and its referral (T-M02-001, T-M02-009, T-M02-010, T-M02-015; RFC decisions 1, 5,
-- 6, 7, 14): two tenant tables and eleven pgEnums, each a mirror of domain's CRM tuple.
--
-- Stage and R9 state are two fields (decision 6): the stage moves by the work, the state parks or
-- closes the lead and never moves the stage, so "returns to its prior stage" is clearing the state.
-- A snoozed lead names its wake date, and only a lost lead names a resurface date (M02-51, M02-54).
-- The latest close is domain's `LeadClose` — which terminal state, its reason where that state has
-- one, when and by whom — set together; it stays on the record after a reopen (M02-56), so it is tied
-- to closed_as, never to the current state.
--
-- Only the phone is required at capture (M02-01, M02-03): name and city are the customer's gaps,
-- and the segment is a gap too where an imported row carries no type — nothing is invented to fill
-- one. The bill is in the tenant's currency's minor unit, the one currency a tenant has (`F1`); a
-- lead's value is a named gap here (decision 14), so no estimate column exists.
--
-- reopen_count, unanswered_calls and last_activity_at are kept on the row because the RFC rules the
-- daily sweep and every list a one-row read (decision 7, T-M02-015); each is written in the
-- transaction of the act that changes it.
--
-- referral links a referring customer to the referred lead, one per lead (M02-16), and carries no
-- money: no credit, redemption or balance exists. A referrer who is not a customer is the lead's
-- referred_by_name.
--
-- Tenant-scoped, all four always. SELECT, INSERT and UPDATE for app_user on both: a lead moves
-- through its fields, and a merge re-points a lead's customer and a referral's referrer. No DELETE:
-- no state ever deletes a lead (M02-49).
--
-- Additive only: new tables and new types nothing older reads.
CREATE TYPE "public"."lead_stage" AS ENUM('new', 'contacted', 'qualified', 'survey', 'design', 'proposal', 'negotiating', 'won');--> statement-breakpoint
CREATE TYPE "public"."lead_lifecycle_state" AS ENUM('snoozed', 'dormant', 'disqualified', 'lost', 'junk');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('quick_add', 'import', 'referral');--> statement-breakpoint
CREATE TYPE "public"."deal_segment" AS ENUM('residential', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."roof_ownership" AS ENUM('own', 'rent');--> statement-breakpoint
CREATE TYPE "public"."roof_type" AS ENUM('rcc_flat', 'metal_shed', 'tile', 'ground_array');--> statement-breakpoint
CREATE TYPE "public"."shading" AS ENUM('none', 'partial', 'heavy');--> statement-breakpoint
CREATE TYPE "public"."buying_timeline" AS ENUM('within_month', 'one_to_three_months', 'three_to_six_months', 'later');--> statement-breakpoint
CREATE TYPE "public"."decision_maker" AS ENUM('this_person', 'someone_else');--> statement-breakpoint
CREATE TYPE "public"."disqualify_reason" AS ENUM('renting', 'budget', 'not_interested', 'unreachable', 'already_installed', 'wrong_number');--> statement-breakpoint
CREATE TYPE "public"."lost_reason" AS ENUM('price', 'chose_competitor', 'postponed', 'not_reachable', 'roof_unsuitable', 'financing_failed', 'not_interested');--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"source" "lead_source" NOT NULL,
	"segment" "deal_segment",
	"stage" "lead_stage" NOT NULL,
	"lifecycle_state" "lead_lifecycle_state",
	"owner_user_id" uuid,
	"monthly_bill_minor" bigint,
	"roof_ownership" "roof_ownership",
	"roof_type" "roof_type",
	"shading" "shading",
	"buying_timeline" "buying_timeline",
	"decision_maker" "decision_maker",
	"referred_by_name" text,
	"snooze_wake_on" date,
	"resurface_on" date,
	"disqualify_reason" "disqualify_reason",
	"lost_reason" "lost_reason",
	"closed_as" "lead_lifecycle_state",
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"no_call_until" date,
	"reopen_count" integer DEFAULT 0 NOT NULL,
	"unanswered_calls" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"unassigned_escalated_at" timestamp with time zone,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "lead_bill_not_negative" CHECK ("lead"."monthly_bill_minor" >= 0),
	CONSTRAINT "lead_counts_not_negative" CHECK ("lead"."reopen_count" >= 0 and "lead"."unanswered_calls" >= 0),
	CONSTRAINT "lead_snoozed_has_wake_date" CHECK (("lead"."lifecycle_state" is not distinct from 'snoozed') = ("lead"."snooze_wake_on" is not null)),
	CONSTRAINT "lead_resurfaces_only_when_lost" CHECK ("lead"."resurface_on" is null or "lead"."lifecycle_state" is not distinct from 'lost'),
	CONSTRAINT "lead_close_is_whole" CHECK (("lead"."closed_as" is null or "lead"."closed_as" in ('disqualified', 'lost', 'junk')) and ("lead"."closed_as" is null) = ("lead"."closed_at" is null) and ("lead"."closed_at" is null) = ("lead"."closed_by" is null) and ("lead"."closed_as" is not distinct from 'disqualified') = ("lead"."disqualify_reason" is not null) and ("lead"."closed_as" is not distinct from 'lost') = ("lead"."lost_reason" is not null))
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"referring_customer_id" uuid NOT NULL,
	"referred_lead_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_owner_user_id_user_account_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_closed_by_user_account_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referring_customer_id_customer_id_fk" FOREIGN KEY ("referring_customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referred_lead_id_lead_id_fk" FOREIGN KEY ("referred_lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_tenant_customer_idx" ON "lead" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "lead_tenant_created_idx" ON "lead" USING btree ("tenant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "lead_tenant_inbox_idx" ON "lead" USING btree ("tenant_id","created_at" DESC NULLS LAST) WHERE "lead"."owner_user_id" is null and "lead"."lifecycle_state" is null;--> statement-breakpoint
CREATE INDEX "lead_tenant_owner_idx" ON "lead" USING btree ("tenant_id","owner_user_id","lifecycle_state","stage");--> statement-breakpoint
CREATE INDEX "lead_tenant_bill_idx" ON "lead" USING btree ("tenant_id","monthly_bill_minor");--> statement-breakpoint
CREATE INDEX "lead_tenant_last_activity_idx" ON "lead" USING btree ("tenant_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "lead_tenant_snooze_wake_idx" ON "lead" USING btree ("tenant_id","snooze_wake_on") WHERE "lead"."snooze_wake_on" is not null;--> statement-breakpoint
CREATE INDEX "lead_tenant_resurface_idx" ON "lead" USING btree ("tenant_id","resurface_on") WHERE "lead"."resurface_on" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_tenant_creation_key" ON "lead" USING btree ("tenant_id","creation_key") WHERE "lead"."creation_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "referral_tenant_referred_lead_key" ON "referral" USING btree ("tenant_id","referred_lead_id");--> statement-breakpoint
CREATE INDEX "referral_tenant_referring_customer_idx" ON "referral" USING btree ("tenant_id","referring_customer_id");--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "lead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lead_tenant" ON "lead" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "lead" TO app_user;--> statement-breakpoint
ALTER TABLE "referral" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "referral" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "referral_tenant" ON "referral" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "referral" TO app_user;
