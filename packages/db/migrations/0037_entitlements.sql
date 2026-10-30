-- 0037 · entitlements (T-M12-008): a company's current limit per key (M12-16) and support's
-- audited overrides on its limits and trial (M12-19, M12-52).
--
-- Both tables are tenant-scoped, all four; app_user holds SELECT alone. Every writer crosses
-- tenants — signup, the gateway's messages, support — so the admin path writes both.
-- entitlement_override is an append-only ledger (append-only-ledgers.ts).
--
-- Additive only: two new tables, three new enums, and three values on audit_event_type and
-- subject_kind that no older reader is handed — an older api writes no override.
CREATE TYPE "public"."entitlement_limit_kind" AS ENUM('count', 'unlimited', 'custom');--> statement-breakpoint
CREATE TYPE "public"."entitlement_override_kind" AS ENUM('goodwill_credit', 'trial_extension');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('plan', 'trial', 'grant');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.goodwill_credit_issued';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.trial_extended';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'entitlement_override';--> statement-breakpoint
CREATE TABLE "entitlement" (
	"tenant_id" uuid NOT NULL,
	"entitlement_key" text NOT NULL,
	"limit_kind" "entitlement_limit_kind" NOT NULL,
	"limit_value" bigint,
	"source" "entitlement_source" NOT NULL,
	"recomputed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "entitlement_tenant_id_entitlement_key_pk" PRIMARY KEY("tenant_id","entitlement_key"),
	CONSTRAINT "entitlement_count_has_value" CHECK (("entitlement"."limit_kind" = 'count') = ("entitlement"."limit_value" is not null))
);
--> statement-breakpoint
CREATE TABLE "entitlement_override" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"kind" "entitlement_override_kind" NOT NULL,
	"entitlement_key" text,
	"credit" bigint,
	"reason" text NOT NULL,
	"issued_by" uuid NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	CONSTRAINT "entitlement_override_kind_whole" CHECK (("entitlement_override"."kind" = 'goodwill_credit') = ("entitlement_override"."entitlement_key" is not null and "entitlement_override"."credit" is not null and "entitlement_override"."credit" > 0) and ("entitlement_override"."kind" = 'trial_extension') = ("entitlement_override"."entitlement_key" is null and "entitlement_override"."credit" is null)),
	CONSTRAINT "entitlement_override_reason_said" CHECK (length(trim("entitlement_override"."reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "entitlement" ADD CONSTRAINT "entitlement_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_override" ADD CONSTRAINT "entitlement_override_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_override" ADD CONSTRAINT "entitlement_override_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_override" ADD CONSTRAINT "entitlement_override_issued_by_user_account_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entitlement_override_tenant_subscription_idx" ON "entitlement_override" USING btree ("tenant_id","subscription_id","issued_at");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlement_override_one_trial_extension" ON "entitlement_override" USING btree ("tenant_id") WHERE "entitlement_override"."kind" = 'trial_extension';--> statement-breakpoint
ALTER TABLE "entitlement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entitlement" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "entitlement_tenant" ON "entitlement" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "entitlement" TO app_user;--> statement-breakpoint
ALTER TABLE "entitlement_override" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entitlement_override" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "entitlement_override_tenant" ON "entitlement_override" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "entitlement_override" TO app_user;
