# Rules — packages/db (Drizzle + Postgres)

## Schema conventions
- snake_case tables/columns; `id` = uuid v7 default; `tenant_id uuid not null` on every
  tenant-owned table + composite index starting with `tenant_id`; `created_at`/`updated_at`
  timestamptz defaults on everything.
- Money: `numeric(14,2)` INR (never float). Percentages: `numeric(5,2)`. Enums: Postgres
  enums for closed sets that migrations own (lead_stage, project_stage, provenance_tier,
  proposal_status, document_status…); text + Zod refinement for sets that tenants extend.
- State machines (lead stage, project stage) change only through service-layer transition
  functions that validate the edge; raw stage UPDATEs are forbidden.
- Append-only tables (audit_log, usage_events, subscription_events, activity/timeline):
  no UPDATE/DELETE grants.

## The design payload (JSONB)
- `designs.payload jsonb` holds the canonical Project shape from the POC. Rules:
  - Version stamp inside payload (`schemaVersion`); `normalizeProject()` (ported from POC
    persistence/normalize.ts) runs on EVERY read — field-drop protection via Exhaustive<T>.
  - Relational columns mirror ONLY what lists/queries need (kwp, panel_count, price_total,
    health_score, is_recommended, signoff_status, updated fingerprints) — mirrors are
    derived, recomputed on write, never hand-edited.
  - Server-side optimistic concurrency: `version int` column; write requires expected
    version (single-editor rule); conflict → 409, client refetches.
- Surveys are versioned-append: a revisit inserts a new survey version row, never mutates.

## Two-tier catalog (user directive)
- `platform_catalog_items` (global, curated, versioned envelopes) + `tenant_catalog_items`
  (tenant-owned SKUs) + `tenant_catalog_overrides` (price/visibility over platform items).
- Resolution order (implemented ONCE, in domain `CatalogContext` builder):
  tenant override → tenant item → platform item. Sent proposals pin `catalog_version` +
  `price_book_version`; price updates create versions, never mutate rates in place.
- Archive, never delete: removed products keep serving old proposals.

## Migrations
- Drizzle-kit generated SQL, reviewed by hand, append-only (never edit applied files).
- Every migration ships with its down-path noted in a comment (even if we roll forward).
- Migration invariant test: fresh-apply == snapshot schema; seed → migrate → normalize
  round-trips the demo project byte-stable.

## RLS
- Every tenant table: `USING (tenant_id = current_setting('app.tenant_id')::uuid)` policy
  for the `app_user` role; separate `app_admin` role for platform operations (explicit,
  audited). Public customer-link reads go through SECURITY DEFINER functions scoped to
  the link token's single deal — never a broad policy.
