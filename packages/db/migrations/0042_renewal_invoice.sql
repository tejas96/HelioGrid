-- 0042 · yearly renewal (T-M12-012c): a company collected by payment link renews on a fresh link
-- each period (M12-11, F1-40), raised with its own `issued` invoice. The invoice holds the link and
-- the moment an unpaid one is a failed charge (M12-05); it names its payment once the link is paid.
-- An overage add-on on a link rides the link itself, so it carries no gateway add-on ref.
--
-- Old readers: the charge path is the one reader of subscription_invoice, and an old api writes
-- every invoice paid with its payment, which the new check holds. The new enum values are only
-- added here; no statement in this transaction uses them, so the indexes that name them are 0043's.
ALTER TYPE "public"."invoice_status" ADD VALUE 'issued';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "overage_addon" DROP CONSTRAINT "overage_addon_added_whole";--> statement-breakpoint
ALTER TABLE "subscription_invoice" ALTER COLUMN "payment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD COLUMN "gateway_ref" text;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD COLUMN "hosted_url" text;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_invoice_gateway_ref_key" ON "subscription_invoice" USING btree ("gateway_ref") WHERE "subscription_invoice"."gateway_ref" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_invoice_renewal_key" ON "subscription_invoice" USING btree ("tenant_id","subscription_id","pays_through") WHERE "subscription_invoice"."gateway_ref" is not null;--> statement-breakpoint
CREATE INDEX "subscription_renewal_due_idx" ON "subscription" USING btree ("paid_period_end") WHERE "subscription"."gateway_ref" is not null and "subscription"."state" = 'active';--> statement-breakpoint
ALTER TABLE "overage_addon" ADD CONSTRAINT "overage_addon_added_whole" CHECK ("overage_addon"."status" <> 'added' or "overage_addon"."gateway_addon_ref" is not null);--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_paid_by_payment" CHECK (("subscription_invoice"."payment_id" is not null) = ("subscription_invoice"."status" = 'paid'));--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_link_whole" CHECK (("subscription_invoice"."gateway_ref" is null) = ("subscription_invoice"."hosted_url" is null) and ("subscription_invoice"."gateway_ref" is null) = ("subscription_invoice"."due_at" is null));
