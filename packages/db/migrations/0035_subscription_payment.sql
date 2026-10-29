-- 0035 · charge truth (T-M12-006): every charge the gateway collected, the payment a successful
-- charge writes (M12-09). The gateway's charge reference is the one idempotency key, so the same
-- charge told twice is one row. Only successful charges are rows; a failure is a state move.
--
-- Tenant-scoped, all four. app_user holds SELECT alone: the gateway's messages cross tenants, so
-- the admin path writes it. Append-only.
--
-- Additive only: one new table nothing older reads.
CREATE TABLE "subscription_payment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"gateway_charge_ref" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency_code" text NOT NULL,
	"pays_through" timestamp with time zone NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_payment_charge_ref_key" ON "subscription_payment" USING btree ("gateway_charge_ref");--> statement-breakpoint
CREATE INDEX "subscription_payment_tenant_subscription_idx" ON "subscription_payment" USING btree ("tenant_id","subscription_id","occurred_at");--> statement-breakpoint
ALTER TABLE "subscription_payment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_payment" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "subscription_payment_tenant" ON "subscription_payment" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "subscription_payment" TO app_user;
