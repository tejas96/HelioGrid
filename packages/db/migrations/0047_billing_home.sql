-- 0047 · Billing Home (T-M12-002): an Owner cancels to the paid period end with an optional
-- reason (M12-50), takes the first cycle's 7-day refund back to its source with the scheme's
-- credit note (M12-47), and reactivates a dead row through a new hosted page (M12-08).
--
-- credit_note is tenant-scoped, all four; app_user holds SELECT alone — the refund writes it on
-- the admin path. credit_note_sequence is global: app_user holds no grant.
--
-- The release before reads none of this: the enum values are written only by the new acts, and
-- its invoice reads filter `status in ('issued','failed')` or render a status it is handed; the
-- new columns are nullable, which new code reads as "no reason" and "begins at the charge". The
-- payment CHECK is rewritten with the old values only — a value added in this transaction cannot
-- be used in it — and accepts every row the old one did.
CREATE TYPE "public"."cancellation_reason" AS ENUM('too_expensive', 'missing_something', 'moving_tool', 'business_pausing', 'something_else');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.subscription_cancelled';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.refund_issued';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'billing.reactivated';--> statement-breakpoint
ALTER TYPE "public"."subscription_cause" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'subscription';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'credit_note';--> statement-breakpoint
CREATE TABLE "credit_note" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"market_code" text NOT NULL,
	"number" text NOT NULL,
	"artefact" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency_code" text NOT NULL,
	"gateway_refund_ref" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"pdf_file_id" uuid
);
--> statement-breakpoint
CREATE TABLE "credit_note_sequence" (
	"market_code" text NOT NULL,
	"fiscal_year" text NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "credit_note_sequence_market_code_fiscal_year_pk" PRIMARY KEY("market_code","fiscal_year")
);
--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD COLUMN "opened_by" uuid;--> statement-breakpoint
ALTER TABLE "billing_checkout" ADD CONSTRAINT "billing_checkout_opened_by_user_account_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "cancellation_reason" "cancellation_reason";--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_invoice_id_subscription_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscription_invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_pdf_file_id_file_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_note_invoice_key" ON "credit_note" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_note_number_key" ON "credit_note" USING btree ("market_code","number");--> statement-breakpoint
CREATE INDEX "credit_note_tenant_issued_idx" ON "credit_note" USING btree ("tenant_id","issued_at");--> statement-breakpoint
ALTER TABLE "subscription_invoice" DROP CONSTRAINT "subscription_invoice_paid_by_payment";--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_paid_by_payment" CHECK (("subscription_invoice"."payment_id" is not null) = ("subscription_invoice"."status" not in ('issued', 'failed')));--> statement-breakpoint
ALTER TABLE "credit_note" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credit_note" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "credit_note_tenant" ON "credit_note" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "credit_note" TO app_user;
