-- 0004 — make the role graph real: the documented runtime role now exists.
-- Down-path: revoke membership, drop app_runtime, alter app_admin nologin. We roll forward.
--
-- 0001 created app_user and app_admin as NOLOGIN *group* roles, but no LOGIN role existed
-- anywhere in this repo. `.env.example` points DATABASE_URL at `app_runtime` — a role no
-- migration creates — so a database migrated purely from this repo had NO role the app
-- could connect as, and every environment quietly fell back to a superuser. docs/08 §124
-- is explicit that "the postgres-flex default `postgres` superuser is never a connection
-- string in any app"; this migration is what makes that instruction followable.
--
-- WHY GROUP + LOGIN ROLES, NOT JUST ONE: RLS policies are written `to app_user` and DO
-- apply to its members, but role ATTRIBUTES (BYPASSRLS, SUPERUSER, LOGIN) are NEVER
-- inherited through membership. So the privilege that must not leak (BYPASSRLS) can only
-- ever be held by a role that names it explicitly — membership alone can never grant it.
--
-- PASSWORDS ARE SET OUT-OF-BAND, deliberately: no secret is ever written into an
-- append-only, hash-locked file that lives in git. After this migration runs, set them:
--   alter role app_runtime password '<from secret store>';
--   alter role app_admin   password '<from secret store>';

do $$ begin
  -- The api's runtime identity: subject to RLS, no DDL, no bypass. DATABASE_URL uses this.
  if not exists (select from pg_roles where rolname = 'app_runtime') then
    create role app_runtime login noinherit nobypassrls nosuperuser nocreatedb nocreaterole;
  end if;
  -- INHERIT is required, not optional: app_runtime must pick up app_user's table grants
  -- and be matched by the `to app_user` policies. (Set explicitly in case the role already
  -- existed from a hand-rolled dev setup — several environments created it by hand.)
  alter role app_runtime inherit login nobypassrls nosuperuser;
end $$;

grant app_user to app_runtime;

-- The audited cross-tenant path (auth.admin.repository.ts) needs BYPASSRLS, which it can
-- only hold directly. Making the existing group role loginable keeps the graph at three
-- roles instead of five; splitting a separate DDL/migrator identity from this admin
-- identity is a follow-up once infra owns role provisioning.
alter role app_admin login;
