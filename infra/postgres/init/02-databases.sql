-- Databases and connect-level privileges. Runs after 01-roles.sql, as the superuser, against the
-- application database — heliogrid_dev from the container's entrypoint, heliogrid_ci from the CI
-- lane — which is why the CONNECT grant names :DBNAME, psql's own variable for the database it
-- is connected to, rather than a literal. The entrypoint uses `psql -v ON_ERROR_STOP=1` with no
-- wrapping transaction, so CREATE DATABASE is legal here.

-- Temporal's two stores cannot share one database: both hold `schema_version` and
-- `schema_update_history`, so merging them makes temporal-sql-tool read one store's version and
-- apply the other's upgrades. Neither store is optional — temporal.yaml sets
-- `visibilityStore: visibility` and the server refuses to start without one.
--
-- Separate DATABASES, same container. That is what keeps the tenancy invariant meaningful: it
-- queries pg_class, which is per-database, so it scans heliogrid_dev and never sees Temporal's
-- tenant-less tables.
CREATE DATABASE temporal            OWNER temporal;
CREATE DATABASE temporal_visibility OWNER temporal;

GRANT CONNECT ON DATABASE :"DBNAME" TO app_runtime, app_admin, qa_readonly;

-- Redundant today: Postgres 15+ revoked CREATE from PUBLIC but not USAGE, so `public`'s ACL
-- already grants it. Explicit so that a future migration revoking USAGE from PUBLIC does not
-- silently blind these three roles.
GRANT USAGE   ON SCHEMA   public        TO app_runtime, app_admin, qa_readonly;

-- LOAD-BEARING. Postgres 15+ revokes CREATE on `public` from PUBLIC and the schema is owned by
-- `heliogrid`, so without this `pnpm db:migrate` dies creating schema_migrations. This grants
-- the migration role the ability to migrate at all; TABLE-level grants remain migration 0001's.
GRANT CREATE ON SCHEMA public TO app_admin;

-- No extensions, no table grants, no default privileges. Law 9 — a migration authors each when
-- its module needs it; a table no migration has granted is invisible to qa_readonly.
