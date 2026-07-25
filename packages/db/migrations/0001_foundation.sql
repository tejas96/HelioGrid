-- 0001_foundation — identity/platform spine (docs/04 §1, §2 files, §10; docs/14 Day 1–2).
-- Hand-authored: partitioned tables + RLS roles are beyond drizzle-kit's emit; the Drizzle
-- schema in src/schema/* mirrors this DDL as the query layer.
-- Better Auth tables (user/session/account/verification/organization/member/invitation/jwks)
-- are NOT authored here — Better Auth's own migrator runs alongside (docs/14).
-- Down-path: drop tables in reverse order, then enums, then roles. We roll forward.

-- ───────────────────────────── roles (RLS plumbing) ─────────────────────────────
-- app_user: the API's runtime role — subject to RLS, no BYPASSRLS (rules/api.md §tenancy).
-- app_admin: explicit platform-admin role, BYPASSRLS, used only by audited admin paths.
do $$ begin
  if not exists (select from pg_roles where rolname = 'app_user') then
    create role app_user nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'app_admin') then
    create role app_admin nologin bypassrls;
  end if;
end $$;

-- ─────────────────────────────────── enums ──────────────────────────────────────
create type tenant_segment as enum ('residential', 'ci', 'both');
create type tenant_status as enum ('active', 'suspended', 'churned');
create type ui_language as enum ('en', 'hi', 'mr');
create type unit_pref as enum ('m', 'ft');
create type user_status as enum ('invited', 'active', 'deactivated');
create type role_preset as enum ('owner', 'manager', 'sales_rep', 'surveyor', 'designer', 'engineer');
create type file_kind as enum ('photo', 'document', 'logo', 'receipt', 'recording', 'transcript', 'export', 'kyc');
create type file_subject as enum ('lead', 'survey', 'design', 'proposal', 'project', 'call', 'tenant');
create type file_status as enum ('pending_upload', 'uploaded', 'deleted');
create type usage_metric as enum (
  'voice_minutes', 'ai_detections', 'otp_sms', 'storage_gb',
  'solar_data_fetch', 'map_tile_fetch', 'dem_tile_fetch', 'push_sent', 'document_rendered'
);
create type audit_actor_type as enum ('user', 'agent', 'system', 'webhook', 'admin');
create type phone_provider as enum ('exotel');
create type phone_number_type as enum ('platform', 'byo');
create type cli_series as enum ('series_1600', 'series_140', 'standard');
create type number_status as enum ('provisioning', 'kyc_pending', 'active', 'porting', 'suspended', 'released');
create type phone_purpose as enum ('outbound', 'inbound', 'both');
create type mutation_result as enum ('applied', 'rejected');

-- ────────────────────────────────── tenants ─────────────────────────────────────
-- PLATFORM root. id IS the Better Auth organization.id (created in one transaction at signup).
-- ids are UUIDv7 generated app-side (docs/04) — no DB default on purpose.
create table tenants (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  segment tenant_segment,
  typical_system_kw numeric(8,2),
  gstin text,
  address jsonb,
  bank_details jsonb,
  logo_file_id uuid,
  country_code text not null default 'IN',
  state_code text,
  status tenant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────── users ──────────────────────────────────────
-- id IS the Better Auth user.id; auth tables carry credentials only.
create table users (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  phone_e164 text not null unique,
  language ui_language not null default 'en',
  units_pref unit_pref not null default 'm',
  photo_file_id uuid,
  status user_status not null default 'invited',
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index users_tenant_status_idx on users (tenant_id, status);

create table user_roles (
  tenant_id uuid not null references tenants(id),
  user_id uuid not null references users(id),
  role role_preset not null,
  granted_by uuid references users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id, role)
);

-- ─────────────────────────────────── files ──────────────────────────────────────
-- Object registry (Tigris `sin`); presigned upload/download only.
create table files (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  bucket text not null,
  object_key text not null,
  mime text,
  bytes bigint,
  sha256 text,
  kind file_kind not null,
  subject_type file_subject,
  subject_id uuid,
  status file_status not null default 'pending_upload',
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index files_tenant_subject_idx on files (tenant_id, subject_type, subject_id);
alter table tenants
  add constraint tenants_logo_file_fk foreign key (logo_file_id) references files(id);
alter table users
  add constraint users_photo_file_fk foreign key (photo_file_id) references files(id);

-- ────────────────────────────── tenant_phone_numbers ────────────────────────────
-- Platform Exophone or BYO (hosting/forwarding with KYC — never CLI spoofing).
-- ivr_flow_id FK lands with the voice module's migration (ivr_flows, docs/04 §8).
create table tenant_phone_numbers (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  phone_e164 text not null,
  provider phone_provider not null default 'exotel',
  provider_ref text,
  number_type phone_number_type not null,
  cli_series cli_series not null default 'standard',
  status number_status not null default 'provisioning',
  kyc jsonb,
  purpose phone_purpose not null default 'both',
  ivr_flow_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone_e164)
);

-- ────────────────────────────── sync_mutations ──────────────────────────────────
-- Offline-write idempotency ledger: at-least-once upload → exactly-once apply.
-- Rows >90 days purged by a worker job (docs/04 §10).
create table sync_mutations (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  user_id uuid not null references users(id),
  mutation_id text not null unique,
  entity_type text not null,
  entity_id uuid,
  applied_at timestamptz not null default now(),
  result mutation_result not null
);
create index sync_mutations_entity_idx on sync_mutations (tenant_id, entity_type, entity_id);

-- ─────────────────────────────── audit_log ──────────────────────────────────────
-- Append-only; tenant_id null = platform-level action. Range-partitioned by month;
-- partition upkeep is a worker job from Track A — 0001 seeds 12 months + default.
create table audit_log (
  id uuid not null,
  tenant_id uuid,
  actor_type audit_actor_type not null,
  actor_id uuid,
  action text not null,
  subject_type text,
  subject_id uuid,
  changes jsonb,
  ip inet,
  occurred_at timestamptz not null default now(),
  primary key (id, occurred_at)
) partition by range (occurred_at);

create index audit_log_tenant_idx on audit_log (tenant_id, occurred_at);
create index audit_log_occurred_brin on audit_log using brin (occurred_at);

do $$
declare
  m date := date '2026-07-01';
begin
  for i in 0..11 loop
    execute format(
      'create table audit_log_%s partition of audit_log for values from (%L) to (%L)',
      to_char(m, 'YYYY_MM'), m, m + interval '1 month'
    );
    m := m + interval '1 month';
  end loop;
end $$;
create table audit_log_default partition of audit_log default;

-- ────────────────────────────── usage_events ────────────────────────────────────
-- Append-only metered ledger, full metric enum from day one. Partitioned monthly by
-- period_key (the billing-period bucket, docs/04 §9) so (idempotency_key, period_key)
-- is an enforceable uniqueness guarantee — duplicate emits are no-ops. Producers derive
-- period_key from occurred_at ('YYYY-MM'), so retries always carry the same pair.
create table usage_events (
  id uuid not null,
  tenant_id uuid not null,
  metric usage_metric not null,
  quantity numeric(12,3) not null,
  unit text not null,
  subject_type text,
  subject_id uuid,
  provider_ref text,
  cost_estimate_paise bigint,
  idempotency_key text not null,
  occurred_at timestamptz not null default now(),
  period_key text not null,
  primary key (id, period_key)
) partition by range (period_key);

create unique index usage_events_idem_idx on usage_events (idempotency_key, period_key);
create index usage_events_tenant_metric_idx on usage_events (tenant_id, metric, period_key);
create index usage_events_occurred_brin on usage_events using brin (occurred_at);

do $$
declare
  m date := date '2026-07-01';
begin
  for i in 0..11 loop
    execute format(
      'create table usage_events_%s partition of usage_events for values from (%L) to (%L)',
      to_char(m, 'YYYY_MM'), to_char(m, 'YYYY-MM'), to_char(m + interval '1 month', 'YYYY-MM')
    );
    m := m + interval '1 month';
  end loop;
end $$;
create table usage_events_default partition of usage_events default;

-- ──────────────────────────── RLS: enable + policies ────────────────────────────
-- RLS is the BACKSTOP; the tenant-scoped repository layer is primary (both exist, always).
-- current_setting(..., true) yields NULL when app.tenant_id is unset → zero rows (fail closed).

alter table tenants enable row level security;
create policy tenant_self on tenants for all to app_user
  using (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table users enable row level security;
create policy tenant_isolation on users for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table user_roles enable row level security;
create policy tenant_isolation on user_roles for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table files enable row level security;
create policy tenant_isolation on files for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table tenant_phone_numbers enable row level security;
create policy tenant_isolation on tenant_phone_numbers for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table sync_mutations enable row level security;
create policy tenant_isolation on sync_mutations for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table audit_log enable row level security;
create policy tenant_isolation on audit_log for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table usage_events enable row level security;
create policy tenant_isolation on usage_events for all to app_user
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- ─────────────────────────────────── grants ─────────────────────────────────────
-- Append-only census (docs/04 §12): audit_log, usage_events, sync_mutations get NO
-- UPDATE/DELETE grants for app_user. app_admin is BYPASSRLS but still needs grants.
grant usage on schema public to app_user, app_admin;

grant select, update on tenants to app_user;
grant select, insert, update on users to app_user;
grant select, insert, delete on user_roles to app_user;
grant select, insert, update on files to app_user;
grant select, insert, update on tenant_phone_numbers to app_user;
grant select, insert on sync_mutations to app_user;
grant select, insert on audit_log to app_user;
grant select, insert on usage_events to app_user;

grant select, insert, update, delete on all tables in schema public to app_admin;
-- Future tables: each module's migration grants explicitly — no blanket default privileges
-- for app_user, so a forgotten grant fails closed instead of leaking.
