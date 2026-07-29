-- 0003 — tenant-scope two uniqueness constraints that were declared globally.
-- Down-path: recreate the global forms and drop the composites. We roll forward.
--
-- Both constraints were written without tenant_id, which in a multi-tenant database means
-- one tenant's key can suppress another tenant's row. Sibling tables in 0001 already do it
-- correctly (tenant_phone_numbers: `unique (tenant_id, phone_e164)`), so this is a slip,
-- not a design.
--
-- SAFE TO RUN NON-CONCURRENTLY: both tables are EMPTY and have no producers — the billing
-- and sync modules are not built (Law 9). Verified 0 rows before authoring. On a populated
-- table this file would instead carry the `-- heliogrid:no-transaction` directive and build
-- each partition's index with CREATE INDEX CONCURRENTLY, because the rewrite below takes
-- ACCESS EXCLUSIVE. Keeping it transactional here buys atomicity for free.

-- ── usage_events: a DROPPED BILLABLE EVENT ───────────────────────────────────────
-- `unique (idempotency_key, period_key)` is global. Two tenants emitting the same
-- idempotency_key in the same billing period collapse to ONE row, and the second tenant's
-- usage is silently discarded — money law violation (root CLAUDE.md: "one money path…
-- reconcile to the paisa"). Producers derive period_key from occurred_at, so the collision
-- needs no coincidence beyond two tenants using the same key shape, which is the norm.
--
-- period_key MUST remain in the index: Postgres requires a unique index on a partitioned
-- table to contain every partition-key column.
drop index if exists usage_events_idem_idx;
create unique index usage_events_idem_idx
  on usage_events (tenant_id, idempotency_key, period_key);

-- ── sync_mutations: a REJECTED LEGITIMATE MUTATION ───────────────────────────────
-- mutation_id is CLIENT-generated on an offline device. Global uniqueness means one
-- tenant's device id can reject another tenant's mutation as a replay.
alter table sync_mutations drop constraint if exists sync_mutations_mutation_id_key;
alter table sync_mutations add constraint sync_mutations_tenant_mutation_key
  unique (tenant_id, mutation_id);
