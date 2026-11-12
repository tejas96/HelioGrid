-- 0064 · sales execution and the owner home (block 6: M07, M13). monthly_target is the company's
-- monthly goal, set inline on the owner dashboard (M13-17): the goal only, one per company and month,
-- actuals read at view time; clearing it deletes the row. monthly_summary is the claim that the
-- month's in-app summary was written once (M13-21). The audit vocabulary gains Lost, Won and
-- Cancelled-after-Won (F2-22) and the target's change; notifications gain the monthly summary.
--
-- Tenant-scoped, all four always: monthly_target SELECT, INSERT, UPDATE, DELETE; monthly_summary
-- SELECT and INSERT alone (a claim never changes). Additive only.
--
ALTER TYPE "public"."audit_event_type" ADD VALUE 'crm.lead_lost' BEFORE 'payments.payment_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'projects.project_won' BEFORE 'payments.payment_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'projects.project_cancelled' BEFORE 'payments.payment_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.monthly_target_changed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'monthly_summary' BEFORE 'system';--> statement-breakpoint
CREATE TABLE "monthly_summary" (
	"tenant_id" uuid NOT NULL,
	"month" date NOT NULL,
	"written_at" timestamp with time zone NOT NULL,
	CONSTRAINT "monthly_summary_tenant_id_month_pk" PRIMARY KEY("tenant_id","month")
);
--> statement-breakpoint
CREATE TABLE "monthly_target" (
	"tenant_id" uuid NOT NULL,
	"month" date NOT NULL,
	"amount_minor" bigint NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	"set_by" uuid NOT NULL,
	CONSTRAINT "monthly_target_tenant_id_month_pk" PRIMARY KEY("tenant_id","month"),
	CONSTRAINT "monthly_target_month_first_day" CHECK (extract(day from "monthly_target"."month") = 1),
	CONSTRAINT "monthly_target_amount_not_negative" CHECK ("monthly_target"."amount_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "monthly_summary" ADD CONSTRAINT "monthly_summary_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_target" ADD CONSTRAINT "monthly_target_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_target" ADD CONSTRAINT "monthly_target_set_by_user_account_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_target" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "monthly_target" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "monthly_target_tenant" ON "monthly_target" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "monthly_target" TO app_user;--> statement-breakpoint
ALTER TABLE "monthly_summary" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "monthly_summary" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "monthly_summary_tenant" ON "monthly_summary" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "monthly_summary" TO app_user;
