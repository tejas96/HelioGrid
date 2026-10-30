-- 0036 · billing ports (T-M12-007): the plan prices the gateway mirrors (M12-12), the hosted
-- checkout a trial opens (M12-54, M12-10), the transport dedupe of the gateway's messages, and
-- what a converted subscription pays for.
--
-- plan_price and billing_gateway_event are GLOBAL and UNREACHABLE: no company owns a price, and a
-- message names no company until it is read. No grant to app_user; the admin path alone.
-- billing_checkout is tenant-scoped, all four; app_user holds SELECT alone, since the gateway's
-- messages cross tenants and the admin path writes it.
--
-- Additive only: three new tables, three new enums, and four nullable subscription columns no
-- older reader selects. A trial row written before this reads as "no plan yet".
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."collection_kind" AS ENUM('mandate', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('starter', 'growth', 'pro', 'enterprise');--> statement-breakpoint
CREATE TABLE "billing_checkout" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"plan_price_id" uuid NOT NULL,
	"collection" "collection_kind" NOT NULL,
	"gateway_ref" text NOT NULL,
	"hosted_url" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"cancel_requested_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "billing_gateway_event" (
	"provider" text NOT NULL,
	"event_ref" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	CONSTRAINT "billing_gateway_event_provider_event_ref_pk" PRIMARY KEY("provider","event_ref")
);
--> statement-breakpoint
CREATE TABLE "plan_price" (
	"id" uuid PRIMARY KEY NOT NULL,
	"market_code" text NOT NULL,
	"pack_version" text NOT NULL,
	"tier" "tier" NOT NULL,
	"cycle" "billing_cycle" NOT NULL,
	"currency_code" text NOT NULL,
	"list_minor" bigint NOT NULL,
	"collected_minor" bigint NOT NULL,
	"gateway_plan_ref" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "tier" "tier";--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "cycle" "billing_cycle";--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "plan_price_id" uuid;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "gateway_ref" text;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD CONSTRAINT "billing_checkout_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD CONSTRAINT "billing_checkout_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD CONSTRAINT "billing_checkout_plan_price_id_plan_price_id_fk" FOREIGN KEY ("plan_price_id") REFERENCES "public"."plan_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkout_gateway_ref_key" ON "billing_checkout" USING btree ("gateway_ref");--> statement-breakpoint
CREATE INDEX "billing_checkout_tenant_subscription_idx" ON "billing_checkout" USING btree ("tenant_id","subscription_id","opened_at");--> statement-breakpoint
CREATE INDEX "billing_checkout_open_idx" ON "billing_checkout" USING btree ("expires_at") WHERE "billing_checkout"."closed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkout_one_open" ON "billing_checkout" USING btree ("tenant_id","subscription_id") WHERE "billing_checkout"."closed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_price_version_key" ON "plan_price" USING btree ("market_code","tier","cycle","currency_code","pack_version");--> statement-breakpoint
CREATE INDEX "plan_price_current_idx" ON "plan_price" USING btree ("market_code","tier","cycle","currency_code","created_at");--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_price_id_plan_price_id_fk" FOREIGN KEY ("plan_price_id") REFERENCES "public"."plan_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_reconcile_live_idx" ON "subscription" USING btree ("gateway_ref") WHERE "subscription"."gateway_ref" is not null and "subscription"."state" in ('active', 'past_due');--> statement-breakpoint
CREATE INDEX "subscription_reconcile_halted_idx" ON "subscription" USING btree ("state_entered_at") WHERE "subscription"."gateway_ref" is not null and "subscription"."state" = 'halted';--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_gateway_ref_key" ON "subscription" USING btree ("gateway_ref") WHERE "subscription"."gateway_ref" is not null;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_whole" CHECK (("subscription"."tier" is null) = ("subscription"."cycle" is null) and ("subscription"."tier" is null) = ("subscription"."plan_price_id" is null) and ("subscription"."tier" is null) = ("subscription"."gateway_ref" is null));--> statement-breakpoint
ALTER TABLE "billing_checkout" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing_checkout" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "billing_checkout_tenant" ON "billing_checkout" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "billing_checkout" TO app_user;
