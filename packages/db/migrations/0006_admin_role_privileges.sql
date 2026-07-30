-- 0006 — make `app_admin` actually able to do the two jobs the repo documents for it.
-- Down-path: `revoke create on schema public from app_admin; revoke app_user from app_admin`.
-- We roll forward.
--
-- .env.example defines DATABASE_ADMIN_URL as the "DDL/migration role (owner) — used ONLY by
-- `pnpm --filter @heliogrid/db migrate`", and says plainly: app_admin, NEVER the `postgres`
-- superuser. infra/README.md then tells an operator to provision with that credential and
-- prove RLS with it. Neither worked, because 0001 granted app_admin USAGE on schema public
-- and never CREATE, and 0004 never made it a member of app_user.
--
-- Nothing caught this because CI migrates as a SUPERUSER, so the credential the repo
-- documents was never the credential any gate exercised.

-- 1. DDL. Without CREATE on schema public, `create table` fails with 42501 (permission denied
--    for schema public). That breaks every future module migration — Law 9 has each module
--    author its own — and `auth:migrate`, which creates the eight Better Auth tables.
grant create on schema public to app_admin;

-- 2. SET ROLE. tests/invariants proves tenant isolation by BECOMING app_user; a role that
--    cannot `set role app_user` cannot run the proof at all. app_admin already holds
--    BYPASSRLS for the audited cross-tenant paths, so membership grants it nothing it could
--    not already do — it only lets the documented admin credential run the documented check.
--    `set role` still requires the caller to ask for it explicitly, and app_user itself stays
--    NOSUPERUSER NOBYPASSRLS, so the invariant is still proving the real subject role.
grant app_user to app_admin;
