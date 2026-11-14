-- The customer's own link is named by a flag, not by a missing contact (`F5-20`, `F5-26`): a link a
-- person names for someone the customer record does not hold also carries no contact, and a later
-- share must never hand out its address as the customer's. Every contact-less link before this one
-- was the first share's mint (the link manager refused to name a second), so each is the customer's.
--
-- Additive: one column with a default, the one-per-deal key moved from "no contact" to the flag; no
-- new grant (customer_link already takes INSERT for app_user).
ALTER TABLE "customer_link" ADD COLUMN "for_customer" boolean DEFAULT false NOT NULL;
UPDATE "customer_link" SET "for_customer" = true WHERE "contact_id" IS NULL;
DROP INDEX "customer_link_one_for_the_customer_key";
CREATE UNIQUE INDEX "customer_link_one_for_the_customer_key" ON "customer_link" USING btree ("tenant_id","lead_id") WHERE "customer_link"."status" = 'active' and "customer_link"."for_customer";
