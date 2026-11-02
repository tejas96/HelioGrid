-- 0048 · Plan selection (T-M12-003): an upgrade pays the part of its cycle left on a payment
-- link and its limits apply at once (M12-48); a downgrade or a cycle switch is scheduled to the
-- paid period's end (M12-49, M12-12); a row whose mandate a change stopped renews through a
-- fresh hosted page (M12-57).
--
-- subscription_plan_change is tenant-scoped, all four; app_user holds SELECT alone — the acts
-- and the timers write it on the admin path.
--
-- The release before reads none of this: billing_checkout.purpose defaults to 'conversion', the
-- only page it opens; the new subscription columns are nullable and it never reads them; the
-- enum values are written only by the new acts. subscription.collection is back-filled from the
-- checkout each live row was converted on — the join the renewal sweep made before — so the new
-- code reads every old row's rail.
CREATE TYPE "public"."checkout_purpose" AS ENUM('conversion', 'plan_change');--> statement-breakpoint
CREATE TYPE "public"."plan_change_status" AS ENUM('scheduled', 'applied', 'withdrawn', 'replaced');--> statement-breakpoint
CREATE TYPE "public"."scheduled_plan_change" AS ENUM('downgrade', 'cycle_switch');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.plan_changed';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.plan_change_scheduled';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.plan_change_withdrawn';--> statement-breakpoint
ALTER TYPE "public"."invoice_kind" ADD VALUE 'proration';--> statement-breakpoint
CREATE TABLE "subscription_plan_change" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"kind" "scheduled_plan_change" NOT NULL,
	"to_plan_price_id" uuid NOT NULL,
	"to_collection" "collection_kind" NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"status" "plan_change_status" NOT NULL,
	"preview_digest" text NOT NULL,
	"scheduled_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	CONSTRAINT "subscription_plan_change_settled" CHECK (("subscription_plan_change"."settled_at" is null) = ("subscription_plan_change"."status" = 'scheduled'))
);
--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD COLUMN "purpose" "checkout_purpose" DEFAULT 'conversion' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD COLUMN "charge_minor" bigint;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD COLUMN "from_plan_price_id" uuid;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD CONSTRAINT "billing_checkout_from_plan_price_id_plan_price_id_fk" FOREIGN KEY ("from_plan_price_id") REFERENCES "public"."plan_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD CONSTRAINT "billing_checkout_plan_change_priced" CHECK (("billing_checkout"."from_plan_price_id" is null) = ("billing_checkout"."purpose" = 'conversion') and ("billing_checkout"."charge_minor" is null) = ("billing_checkout"."purpose" = 'conversion'));--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "collection" "collection_kind";--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "mandate_ending_at" timestamp with time zone;--> statement-breakpoint
UPDATE "subscription" SET "collection" = "billing_checkout"."collection"
	FROM "billing_checkout"
	WHERE "billing_checkout"."gateway_ref" = "subscription"."gateway_ref";--> statement-breakpoint
ALTER TABLE "subscription_plan_change" ADD CONSTRAINT "subscription_plan_change_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plan_change" ADD CONSTRAINT "subscription_plan_change_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plan_change" ADD CONSTRAINT "subscription_plan_change_to_plan_price_id_plan_price_id_fk" FOREIGN KEY ("to_plan_price_id") REFERENCES "public"."plan_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plan_change" ADD CONSTRAINT "subscription_plan_change_scheduled_by_user_account_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_plan_change_tenant_idx" ON "subscription_plan_change" USING btree ("tenant_id","subscription_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plan_change_one_scheduled" ON "subscription_plan_change" USING btree ("tenant_id","subscription_id") WHERE "subscription_plan_change"."status" = 'scheduled';--> statement-breakpoint
CREATE INDEX "subscription_mandate_ending_idx" ON "subscription" USING btree ("mandate_ending_at") WHERE "subscription"."mandate_ending_at" is not null and "subscription"."state" = 'active';--> statement-breakpoint
CREATE INDEX "subscription_plan_change_due_idx" ON "subscription_plan_change" USING btree ("effective_at") WHERE "subscription_plan_change"."status" = 'scheduled';--> statement-breakpoint
ALTER TABLE "subscription_plan_change" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_plan_change" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "subscription_plan_change_tenant" ON "subscription_plan_change" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "subscription_plan_change" TO app_user;
