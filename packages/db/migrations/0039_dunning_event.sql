-- 0039 · the dunning ladder and the trial nudges (T-M12-011): one row per notice told to a
-- subscription (M12-39, M12-42), the subject its notifications name, and what a payment clears
-- (M12-09). Two notification types and a subject kind join the registry.
--
-- Tenant-scoped, all four. app_user holds SELECT alone: the notice sweep and the charge cross
-- tenants, so the admin path writes it.
--
-- Expand only: a new table nothing older reads, and enum values every older reader takes as an
-- open enum with a fallback (the notification wire's `extensibleEnum`).
CREATE TYPE "public"."billing_notice" AS ENUM('payment_failed', 'payment_reminder', 'metered_paused', 'final_warning', 'halted', 'win_back', 'trial_half_way', 'trial_ending', 'trial_ended');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dunning_notice' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'trial_nudge' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'dunning_event';--> statement-breakpoint
CREATE TABLE "dunning_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"notice" "billing_notice" NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"fired_at" timestamp with time zone NOT NULL,
	"forfeiture_disclosed" boolean NOT NULL,
	"next_due_at" timestamp with time zone,
	"cleared_at" timestamp with time zone,
	"cleared_by_payment" uuid
);
--> statement-breakpoint
ALTER TABLE "dunning_event" ADD CONSTRAINT "dunning_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dunning_event" ADD CONSTRAINT "dunning_event_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dunning_event" ADD CONSTRAINT "dunning_event_cleared_by_payment_subscription_payment_id_fk" FOREIGN KEY ("cleared_by_payment") REFERENCES "public"."subscription_payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dunning_event_notice_key" ON "dunning_event" USING btree ("tenant_id","subscription_id","notice","due_at");--> statement-breakpoint
CREATE INDEX "dunning_event_tenant_subscription_idx" ON "dunning_event" USING btree ("tenant_id","subscription_id","due_at");--> statement-breakpoint
CREATE INDEX "dunning_event_next_due_idx" ON "dunning_event" USING btree ("next_due_at") WHERE "dunning_event"."next_due_at" is not null;--> statement-breakpoint
ALTER TABLE "dunning_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dunning_event" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "dunning_event_tenant" ON "dunning_event" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "dunning_event" TO app_user;
