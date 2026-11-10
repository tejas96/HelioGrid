-- 0058 · the retry key on the timeline (T-FPLAT-011, F4-07; T-M02-010, T-M02-013): a call, a note,
-- an enquiry or a copied message sent again with the same key finds the entry the first send wrote
-- instead of writing a second.
--
-- ADDITIVE, one release. The two nullable columns every create's table carries, and a partial unique
-- index on the key leading with tenant_id. An entry a create writes beside its own keyed row (a
-- stage change, a visit booked) carries no key, and every older entry keeps NULL, which the partial
-- index skips. Readers name their columns, so none of them sees the pair.
--
-- The ledger stays a ledger: the columns are written once, in the insert, and app_user keeps SELECT
-- and INSERT alone — no grant changes here.
--
-- Locks: the index is built in the migration's transaction. The table is new in this release, so
-- the build is a short scan under a brief write lock.
ALTER TABLE "activity" ADD COLUMN "creation_key" uuid;--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "creation_fingerprint" text;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_tenant_creation_key" ON "activity" USING btree ("tenant_id","creation_key") WHERE "activity"."creation_key" is not null;
