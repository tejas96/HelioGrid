-- 0002_identity_completion — Track A auth/tenancy slice (docs/04 §1: invites,
-- tenant_settings, tenant_counters). Better Auth tables still belong to its migrator.

create type invite_status as enum ('pending', 'accepted', 'expired', 'revoked');

-- Phone-based invites (Better Auth's email `invitation` table is unused — docs/04 §1).
create table invites (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  phone_e164 text not null,
  roles role_preset[] not null check (cardinality(roles) > 0),
  invited_by uuid not null references users(id),
  token_hash text not null unique,
  status invite_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invites_tenant_status_idx on invites (tenant_id, status);

-- One row per tenant; typed JSONB sections each with a Zod schema in packages/contracts.
create table tenant_settings (
  id uuid primary key,
  tenant_id uuid not null references tenants(id) unique,
  branding jsonb,
  proposal_defaults jsonb,
  lead_sources jsonb,
  capture jsonb,
  locale jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Server-assigned business numbers (proposal_number, project_number): allocated with
-- SELECT … FOR UPDATE inside the issuing transaction — never client-generated.
create table tenant_counters (
  tenant_id uuid not null references tenants(id),
  counter_key text not null,
  next_value bigint not null default 1,
  primary key (tenant_id, counter_key)
);

-- RLS (same fail-closed pattern as 0001)
alter table invites enable row level security;
create policy tenant_isolation on invites for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table tenant_settings enable row level security;
create policy tenant_isolation on tenant_settings for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table tenant_counters enable row level security;
create policy tenant_isolation on tenant_counters for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- Grants: invite revoke/accept are status UPDATEs; counters allocate via UPDATE.
grant select, insert, update on invites to app_user;
grant select, insert, update on tenant_settings to app_user;
grant select, insert, update on tenant_counters to app_user;
grant select, insert, update, delete on invites, tenant_settings, tenant_counters to app_admin;
