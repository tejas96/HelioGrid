-- 0041 · overage add-ons (T-M12-012b): each meter's overage in one closed paid period, reckoned
-- from the usage ledger past the company's allowance at the book's published rate (M12-35), added
-- to its mandate so a later debit collects it, and a line on that debit's invoice.
--
-- overage_addon is tenant-scoped, all four; app_user holds SELECT alone — the sweep crosses
-- tenants, so the admin path writes it. subscription_payment.overage_reckoned_at marks a period
-- reckoned. invoice_line now sells a plan or one add-on, never both.
--
-- Additive for old code: it writes plan lines with plan_price_id set, which the new CHECK accepts,
-- and never reads the new column or table.
CREATE TYPE "public"."overage_addon_status" AS ENUM('pending', 'adding', 'added', 'invoiced', 'over_cap');--> statement-breakpoint
CREATE TABLE "overage_addon" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"meter" "usage_meter" NOT NULL,
	"window_from" timestamp with time zone NOT NULL,
	"window_to" timestamp with time zone NOT NULL,
	"used" bigint NOT NULL,
	"allowance" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"unit_rate_minor" bigint NOT NULL,
	"amount_minor" bigint NOT NULL,
	"status" "overage_addon_status" NOT NULL,
	"reckoned_at" timestamp with time zone NOT NULL,
	"tried_at" timestamp with time zone,
	"gateway_ref" text,
	"gateway_addon_ref" text,
	"gateway_amount_minor" bigint,
	"added_at" timestamp with time zone,
	"invoice_id" uuid,
	CONSTRAINT "overage_addon_billed_meter" CHECK ("overage_addon"."meter" in ('voice_minutes', 'ai_roof_detections', 'marketing_sends', 'tracked_field_seats')),
	CONSTRAINT "overage_addon_bills_something" CHECK ("overage_addon"."quantity" > 0 and "overage_addon"."amount_minor" > 0),
	CONSTRAINT "overage_addon_sent_whole" CHECK (("overage_addon"."status" in ('adding', 'added', 'invoiced')) = ("overage_addon"."gateway_ref" is not null and "overage_addon"."gateway_amount_minor" is not null and "overage_addon"."added_at" is not null)),
	CONSTRAINT "overage_addon_added_whole" CHECK (("overage_addon"."status" in ('added', 'invoiced')) = ("overage_addon"."gateway_addon_ref" is not null)),
	CONSTRAINT "overage_addon_invoiced_whole" CHECK (("overage_addon"."status" = 'invoiced') = ("overage_addon"."invoice_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "invoice_line" ALTER COLUMN "plan_price_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD COLUMN "overage_reckoned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "overage_addon_id" uuid;--> statement-breakpoint
ALTER TABLE "overage_addon" ADD CONSTRAINT "overage_addon_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overage_addon" ADD CONSTRAINT "overage_addon_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overage_addon" ADD CONSTRAINT "overage_addon_payment_id_subscription_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."subscription_payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overage_addon" ADD CONSTRAINT "overage_addon_invoice_id_subscription_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscription_invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "overage_addon_period_key" ON "overage_addon" USING btree ("tenant_id","subscription_id","meter","window_from");--> statement-breakpoint
CREATE INDEX "overage_addon_pending_idx" ON "overage_addon" USING btree ("tried_at" NULLS FIRST,"reckoned_at") WHERE "overage_addon"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "overage_addon_on_mandate_idx" ON "overage_addon" USING btree ("gateway_ref") WHERE "overage_addon"."status" in ('adding', 'added');--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_overage_addon_id_overage_addon_id_fk" FOREIGN KEY ("overage_addon_id") REFERENCES "public"."overage_addon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_payment_overage_due_idx" ON "subscription_payment" USING btree ("pays_through") WHERE "subscription_payment"."overage_reckoned_at" is null;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_sells_one" CHECK (("invoice_line"."plan_price_id" is null) <> ("invoice_line"."overage_addon_id" is null));--> statement-breakpoint
ALTER TABLE "overage_addon" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "overage_addon" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "overage_addon_tenant" ON "overage_addon" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "overage_addon" TO app_user;
