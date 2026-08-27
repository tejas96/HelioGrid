-- Cluster roles. Runs from /docker-entrypoint-initdb.d on an empty data directory only —
-- first start and after `pnpm infra:reset`.
--
-- Roles live here rather than in a migration because they are CLUSTER objects; tables, grants
-- and policies are DATABASE objects and belong to migration 0001. Production matches: Fly
-- Postgres roles are an operator command.
--
-- Guards check EXISTENCE only, never attributes. A role already present with the wrong
-- attributes is left alone, not corrected.

-- The RLS-subject role. NOLOGIN: nothing connects as it; the login roles below are members.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;

-- DDL/migration role. BYPASSRLS is deliberate — the audited cross-tenant paths need it.
-- Membership in app_user is LOAD-BEARING: tests/invariants/src/tenancy-rls.ts runs
-- `set local role app_user` as a preflight and dies with a raw 42501 without it.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin LOGIN PASSWORD 'app_admin' BYPASSRLS IN ROLE app_user;
  END IF;
END $$;

-- The application runtime role. NOT superuser, NOT BYPASSRLS: packages/db/src/client.ts
-- assertRuntimeRoleIsNotPrivileged refuses to boot the api otherwise, because RLS would be a
-- silent no-op.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN PASSWORD 'app_runtime' IN ROLE app_user;
  END IF;
END $$;

-- /verify's qa-api read path. Membership in app_user is the trap: every tenant table is RLS
-- ENABLED and FORCEd with policies written for app_user, so a read-only role with no applicable
-- policy reads ZERO ROWS FROM EVERY TENANT TABLE — and an agent reports those empty results as
-- observed values. That is a confident green proving nothing.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qa_readonly') THEN
    CREATE ROLE qa_readonly LOGIN PASSWORD 'qa_readonly' IN ROLE app_user;
  END IF;
END $$;

-- Temporal's own owner. Name and password match infra/temporal/config/temporal.yaml, which is
-- why that file needs no edit.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'temporal') THEN
    CREATE ROLE temporal LOGIN PASSWORD 'temporal';
  END IF;
END $$;
