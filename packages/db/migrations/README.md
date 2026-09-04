# migrations — empty by design (2026-08-01)

Migrations `0001`–`0006` were deleted in the auth teardown, on an explicit owner ruling that
overrode the append-only law (`packages/db/CLAUDE.md`, mechanism `M19`).

They held the identity/tenancy spine (`tenants`, `users`, `user_roles`) plus the platform
tables that referenced it (`files`, `audit_log`, `usage_events`, `tenant_phone_numbers`,
`sync_mutations`). Those foreign keys are why the auth tables could not be removed
surgically — the spine had to go whole or not at all.

The next migration is `0001`, authored by the auth + tenancy module when its slice begins
(Law 9). Read `docs/engineering/forward-compat.md` before writing it: the `auth/tenancy` row states what
that first migration must already satisfy so later modules are not forced into a refactor.

**This directory is not optional.** The runner does `readdirSync` on it, so it must exist
even while it holds no SQL — which is why this file is here.
