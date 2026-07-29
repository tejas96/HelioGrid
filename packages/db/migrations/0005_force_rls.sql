-- 0005 — FORCE row level security on every RLS-enabled table.
-- Down-path: `alter table <t> no force row level security`. We roll forward.
--
-- docs/08 §109 states the requirement plainly — "table owner does NOT bypass" — and no
-- migration had ever issued it. Without FORCE, `enable row level security` protects every
-- role EXCEPT the one that owns the table, so any seed, backfill, admin script or ops
-- one-off connecting on the owner's credentials silently reads and writes across every
-- tenant while appearing to be governed by policy.
--
-- WHAT THIS DOES NOT CHANGE, deliberately:
--   * SUPERUSERS still bypass RLS unconditionally — FORCE cannot restrain them. That is
--     precisely why 0004 exists and why the api asserts its runtime role is not a superuser.
--   * Roles holding the BYPASSRLS attribute still bypass. `app_admin` holds it, so the
--     audited cross-tenant path (auth.admin.repository.ts) keeps working by design.
-- The net effect is that ownership alone stops being a way around tenancy.
--
-- Partitioned parents (audit_log, usage_events) are listed here; policies are evaluated
-- against the parent because every query path reaches them through the parent, which is
-- what the Drizzle models expose.

do $$
declare t text;
begin
  foreach t in array array[
    'tenants', 'users', 'user_roles',
    'invites', 'tenant_settings', 'tenant_counters',
    'files', 'tenant_phone_numbers', 'sync_mutations',
    'audit_log', 'usage_events'
  ] loop
    execute format('alter table %I force row level security', t);
  end loop;
end $$;
