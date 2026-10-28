-- 0033 · who saved a payment-term template last, and the restore (T-M01-020): the Payment terms
-- page names the person and the date of the newest create or save (SCR-M01-20), and an archived
-- template can be put back in use. A row written before this column reads null and names the
-- date alone.
--
-- Additive only: a nullable column an older api never reads or writes, and an audit value an older
-- api never writes.

ALTER TYPE "public"."audit_event_type" ADD VALUE 'settings.tranche_template_restored' BEFORE 'settings.tranche_template_default_changed';--> statement-breakpoint
ALTER TABLE "tranche_template" ADD COLUMN "changed_by" uuid;--> statement-breakpoint
ALTER TABLE "tranche_template" ADD CONSTRAINT "tranche_template_changed_by_user_account_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;