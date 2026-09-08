-- 0003 · role administration (T-FPLAT-003): the tenant-scoped write path the guarded transitions
-- open. No table, no column, no enum. "membership_role" keeps the policy 0002 declared — USING and
-- WITH CHECK on the tenant pin, fail-closed — and gains the two privileges a role-set replacement
-- needs under it. A person's role rows are replaced only through that transition, which judges
-- F2-19 (the company keeps an EPC Owner and a Manage-team holder) inside the same transaction.
-- Deactivation (F2-20) writes "tenant_membership", whose UPDATE 0002 already granted; nothing
-- here or anywhere grants a DELETE on a person.

GRANT INSERT, DELETE ON TABLE "membership_role" TO app_user;
