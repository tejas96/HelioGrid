-- 0012 · the retry key a create carried (T-FPLAT-011, F4-07): a second send with the same key
-- finds the row the first one made instead of writing another.
--
-- ADDITIVE, one release. Two nullable columns on each table a create route writes — tenant,
-- invitation, tranche_template — and a partial unique index on each key. Every row already there
-- keeps NULL, which the partial index skips, so no older row can ever answer a retry. The api
-- machines still on the previous release insert without naming these columns and read with
-- explicit column lists, so they neither break nor see them.
--
-- Tenancy: invitation and tranche_template keep their policies and grants; the key's unique index
-- leads with tenant_id (M12). tenant's key is GLOBAL and listed in GLOBAL_UNIQUES with its reason:
-- a signup's key is sent before any company exists. tenant is still inserted only on the admin
-- path; no grant changes here.
--
-- Locks: each index is built in the migration's transaction, not CONCURRENTLY. The three tables
-- grow by companies, invites and payment templates — thousands of rows, not millions — and the
-- new column is NULL everywhere, so the build is a short scan under a brief write lock.

ALTER TABLE "tenant" ADD COLUMN "creation_key" uuid;
ALTER TABLE "tenant" ADD COLUMN "creation_fingerprint" text;
ALTER TABLE "invitation" ADD COLUMN "creation_key" uuid;
ALTER TABLE "invitation" ADD COLUMN "creation_fingerprint" text;
ALTER TABLE "tranche_template" ADD COLUMN "creation_key" uuid;
ALTER TABLE "tranche_template" ADD COLUMN "creation_fingerprint" text;

CREATE UNIQUE INDEX "tenant_creation_key" ON "tenant" USING btree ("creation_key") WHERE "tenant"."creation_key" is not null;
CREATE UNIQUE INDEX "invitation_tenant_creation_key" ON "invitation" USING btree ("tenant_id","creation_key") WHERE "invitation"."creation_key" is not null;
CREATE UNIQUE INDEX "tranche_template_tenant_creation_key" ON "tranche_template" USING btree ("tenant_id","creation_key") WHERE "tranche_template"."creation_key" is not null;
