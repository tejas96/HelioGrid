-- 0034 · the subscription lifecycle (T-M12-005): a company's one billing machine and the append-only
-- record of every state it entered (M12-04). The edges and the timers are domain's
-- (commerce/lifecycle.ts); the phase is never stored.
--
-- Tenant-scoped, all four always. app_user holds SELECT alone on both: signup and the billing
-- timers write on the admin path, since both cross tenants. The history is append-only.
--
-- Every company that exists starts its trial now, not from its creation: dating it from creation
-- would expire every older company at once (BM-30: expiry converts, never destroys). A migration
-- has no app-side UUIDv7, so these ids come from gen_random_uuid().
--
-- Additive only: two new tables and an index nothing older reads.
CREATE TYPE "public"."billing_state" AS ENUM('trialing', 'active', 'past_due', 'halted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_cause" AS ENUM('trial_started', 'paid', 'charge_failed', 'cancelled', 'trial_expired', 'grace_expired');--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"state" "billing_state" NOT NULL,
	"state_entered_at" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"paid_period_end" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "subscription_trial_has_end" CHECK ("subscription"."state" <> 'trialing' or "subscription"."trial_ends_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "subscription_state_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"state" "billing_state" NOT NULL,
	"cause" "subscription_cause" NOT NULL,
	"entered_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_state_history" ADD CONSTRAINT "subscription_state_history_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_state_history" ADD CONSTRAINT "subscription_state_history_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_one_live_per_tenant" ON "subscription" USING btree ("tenant_id") WHERE "subscription"."state" in ('trialing', 'active', 'past_due');--> statement-breakpoint
CREATE INDEX "subscription_tenant_created_idx" ON "subscription" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "subscription_trial_due_idx" ON "subscription" USING btree ("trial_ends_at") WHERE "subscription"."state" = 'trialing';--> statement-breakpoint
CREATE INDEX "subscription_grace_due_idx" ON "subscription" USING btree ("state_entered_at") WHERE "subscription"."state" = 'past_due';--> statement-breakpoint
CREATE INDEX "subscription_state_history_tenant_subscription_idx" ON "subscription_state_history" USING btree ("tenant_id","subscription_id","entered_at");--> statement-breakpoint
CREATE INDEX "tenant_created_at_idx" ON "tenant" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "subscription" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "subscription_tenant" ON "subscription" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "subscription" TO app_user;--> statement-breakpoint
ALTER TABLE "subscription_state_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_state_history" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "subscription_state_history_tenant" ON "subscription_state_history" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "subscription_state_history" TO app_user;--> statement-breakpoint
WITH started AS (
	INSERT INTO "subscription" ("id", "tenant_id", "state", "state_entered_at", "trial_ends_at", "created_at")
	SELECT gen_random_uuid(), "id", 'trialing', now(), now() + interval '14 days', now() FROM "tenant"
	RETURNING "id", "tenant_id"
)
INSERT INTO "subscription_state_history" ("id", "tenant_id", "subscription_id", "state", "cause", "entered_at")
SELECT gen_random_uuid(), "tenant_id", "id", 'trialing', 'trial_started', now() FROM started;
