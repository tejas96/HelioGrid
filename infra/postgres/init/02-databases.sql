-- Databases and connect-level privileges. Runs after 01-roles.sql (filename order), against
-- POSTGRES_DB = heliogrid_dev, as the superuser `heliogrid`.
--
-- The Postgres entrypoint runs each file via `psql -v ON_ERROR_STOP=1` and does NOT wrap it in
-- a transaction, so CREATE DATABASE is legal here.

-- Temporal keeps TWO stores and they cannot share one database: both hold a `schema_version`
-- and a `schema_update_history` table (verified against the live cluster, 2026-08-27), so
-- merging them makes temporal-sql-tool read one store's version and apply the other's upgrades.
--   temporal             the engine  — 40 tables, workflow state and history
--   temporal_visibility  the index   — executions_visibility, backing `temporal workflow list`
-- Neither is optional: infra/temporal/config/temporal.yaml:39 sets `visibilityStore: visibility`
-- and the server refuses to start without one.
--
-- They are separate DATABASES in the SAME container. That keeps the tenancy invariant
-- meaningful for free: it queries pg_class, which is per-database, so it scans heliogrid_dev
-- only and never sees Temporal's 43 tenant-less tables.
CREATE DATABASE temporal            OWNER temporal;
CREATE DATABASE temporal_visibility OWNER temporal;

GRANT CONNECT ON DATABASE heliogrid_dev TO app_runtime, app_admin, qa_readonly;

-- Currently a no-op: schema `public`'s ACL already carries `=U/pg_database_owner`, so PUBLIC
-- (and therefore every role) already holds USAGE — Postgres 15+ revoked only CREATE from
-- PUBLIC, not USAGE (verified against the live cluster, 2026-08-27). Kept as an explicit,
-- undeclared-boundary-free statement of intent: if a future migration ever revokes USAGE from
-- PUBLIC, these three roles must not silently lose the ability to see objects in `public`.
GRANT USAGE   ON SCHEMA   public        TO app_runtime, app_admin, qa_readonly;

-- LOAD-BEARING. Postgres 15+ revokes CREATE on schema `public` from PUBLIC, and the schema is
-- owned by `heliogrid`. Without this grant `pnpm db:migrate` dies creating `schema_migrations`
-- — the exact failure .env.local records ("app_admin can neither CREATE in schema public …").
-- This is role provisioning, not module schema: it grants the migration role the ability to
-- migrate at all. TABLE-level grants (SELECT/INSERT to app_user) remain migration 0001's.
GRANT CREATE ON SCHEMA public TO app_admin;

-- NO EXTENSIONS, deliberately. Law 9 — a migration authors one when its module needs it.
-- pg_stat_statements in particular needs shared_preload_libraries, a server-config change.
--
-- NO table grants and NO default privileges. Those are migration 0001's (owner ruling
-- 2026-08-27). Until 0001 lands, qa_readonly can connect and sees nothing, which is correct.
