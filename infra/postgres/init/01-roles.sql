-- Cluster roles for local development. Runs ONCE, from /docker-entrypoint-initdb.d, only when
-- the data directory is empty — i.e. first start and after `pnpm infra:reset`.
--
-- WHY HERE AND NOT IN A MIGRATION. Roles are CLUSTER objects; tables, grants and policies are
-- DATABASE objects. Migrations 0004/0006 created these roles and were deleted in the
-- 2026-08-01 auth teardown (ADR-0024), which is why `app_runtime` — read by
-- packages/db/src/client.ts, packages/db/src/migrate.ts and both tests/invariants/src files —
-- was created by nothing and had to be made by hand. Owner ruling 2026-08-27:
--   infra owns roles · migration 0001 owns tables, GRANTs and CREATE POLICY.
-- This matches production, where Fly Postgres roles are an operator command, not a migration.
--
-- Every statement is guarded (IF NOT EXISTS) for idempotency and collision-safety — this file
-- reruns on every empty-volume start, and existence-only guards mean it never fails re-running
-- against a role a prior run already created. The guard checks EXISTENCE only, not attributes:
-- a role present with different attributes than below is left as-is, not corrected.

-- The RLS-subject role. NOLOGIN: nothing connects as it; the login roles below are members.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;

-- DDL/migration role. BYPASSRLS is deliberate and documented in .env.example: it exists for the
-- audited cross-tenant paths. Membership in app_user is LOAD-BEARING — the tenancy invariant
-- runs `set local role app_user` as a preflight (tests/invariants/src/tenancy-rls.ts) and dies
-- with a raw 42501 if the connecting role is not a member.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin LOGIN PASSWORD 'app_admin' BYPASSRLS IN ROLE app_user;
  END IF;
END $$;

-- The application runtime role. NOT superuser, NOT BYPASSRLS — Postgres defaults to neither,
-- and packages/db/src/client.ts assertRuntimeRoleIsNotPrivileged refuses to boot the api
-- otherwise, because RLS would be a silent no-op.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN PASSWORD 'app_runtime' IN ROLE app_user;
  END IF;
END $$;

-- /verify's qa-api read path (.claude/agents/qa-api.md). Was ALSO created by hand — the same
-- defect as app_runtime, per infra/README.md's "QA read-only role" block.
--
-- Membership in app_user is the trap infra/README.md records: every tenant table is RLS ENABLED
-- and FORCEd with policies written for app_user, so a read-only role with no applicable policy
-- reads ZERO ROWS FROM EVERY TENANT TABLE — and an agent reports those empty results as
-- observed values. That is a confident green proving nothing.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qa_readonly') THEN
    CREATE ROLE qa_readonly LOGIN PASSWORD 'qa_readonly' IN ROLE app_user;
  END IF;
END $$;

-- Temporal's own owner. Name and password MATCH infra/temporal/config/temporal.yaml lines
-- 47-48 and 61-62, which is why that file needs no edit.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'temporal') THEN
    CREATE ROLE temporal LOGIN PASSWORD 'temporal';
  END IF;
END $$;
