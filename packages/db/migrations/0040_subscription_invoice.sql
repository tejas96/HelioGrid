-- 0040 · subscription invoicing (T-M12-012a): the platform invoice every recorded payment issues,
-- in the payment's own transaction (M12-09, M12-44, M12-45). A frozen document: its lines and their
-- tax components are written once, every total is their sum, and the parties' registrations are
-- copied as they stood. invoice_sequence holds each market's gapless series per fiscal year.
--
-- subscription_invoice, invoice_line and invoice_line_tax are tenant-scoped, all four; app_user
-- holds SELECT alone — the charge crosses tenants, so the admin path writes them. invoice_line and
-- invoice_line_tax are append-only. invoice_sequence is global: app_user holds no grant.
--
-- Additive only: four new tables and two new types nothing older reads.
CREATE TYPE "public"."invoice_kind" AS ENUM('cycle');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('paid');--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"plan_price_id" uuid NOT NULL,
	"taxable_minor" bigint NOT NULL,
	"rate_basis_points" integer
);
--> statement-breakpoint
CREATE TABLE "invoice_line_tax" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"line_id" uuid NOT NULL,
	"code" text NOT NULL,
	"amount_minor" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_sequence" (
	"market_code" text NOT NULL,
	"fiscal_year" text NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "invoice_sequence_market_code_fiscal_year_pk" PRIMARY KEY("market_code","fiscal_year")
);
--> statement-breakpoint
CREATE TABLE "subscription_invoice" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"market_code" text NOT NULL,
	"number" text NOT NULL,
	"kind" "invoice_kind" NOT NULL,
	"status" "invoice_status" NOT NULL,
	"currency_code" text NOT NULL,
	"pays_through" timestamp with time zone NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"supplier_registration_type" text,
	"supplier_registration" text,
	"recipient_registration_type" text,
	"recipient_registration" text,
	"supplier_place" text,
	"recipient_place" text,
	"service_code" text,
	CONSTRAINT "subscription_invoice_supplier_whole" CHECK (("subscription_invoice"."supplier_registration_type" is null) = ("subscription_invoice"."supplier_registration" is null)),
	CONSTRAINT "subscription_invoice_recipient_whole" CHECK (("subscription_invoice"."recipient_registration_type" is null) = ("subscription_invoice"."recipient_registration" is null))
);
--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_subscription_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscription_invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_plan_price_id_plan_price_id_fk" FOREIGN KEY ("plan_price_id") REFERENCES "public"."plan_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_tax" ADD CONSTRAINT "invoice_line_tax_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_tax" ADD CONSTRAINT "invoice_line_tax_line_id_invoice_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."invoice_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_payment_id_subscription_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."subscription_payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_line_position_key" ON "invoice_line" USING btree ("tenant_id","invoice_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_line_tax_code_key" ON "invoice_line_tax" USING btree ("tenant_id","line_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_invoice_payment_key" ON "subscription_invoice" USING btree ("tenant_id","payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_invoice_number_key" ON "subscription_invoice" USING btree ("market_code","number");--> statement-breakpoint
CREATE INDEX "subscription_invoice_tenant_issued_idx" ON "subscription_invoice" USING btree ("tenant_id","issued_at");--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE "subscription_invoice" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_invoice" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "subscription_invoice_tenant" ON "subscription_invoice" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "subscription_invoice" TO app_user;--> statement-breakpoint
ALTER TABLE "invoice_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoice_line" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "invoice_line_tenant" ON "invoice_line" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "invoice_line" TO app_user;--> statement-breakpoint
ALTER TABLE "invoice_line_tax" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoice_line_tax" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "invoice_line_tax_tenant" ON "invoice_line_tax" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "invoice_line_tax" TO app_user;
