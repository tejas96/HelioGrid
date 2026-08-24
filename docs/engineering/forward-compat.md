# Forward-compatibility register

> **Mandatory reading before any module's first migration or contract.** Each row states what
> a module must build in NOW so that a later module is not forced into a refactor.
>
> This is the anti-collision device that makes **Law 9** safe: a module may author only its
> own tables precisely because this register tells it which future needs its first migration
> must already satisfy. Without it, module-by-module growth becomes short-sighted rather than
> incremental.
>
> Re-read the relevant row before a module's first migration.

Each register row is satisfied by its owning module's FIRST migration; migration 0001 covers
the identity/platform spine.

| Module | Build in NOW |
|---|---|
| auth/tenancy | Stackable roles M:N; RBAC through ONE deny-by-default guard — a route declares the capability it needs, the guard resolves it from roles (D27 OR-across, D28 no per-person grants); never an inline `if role ===` in a handler, or every new role becomes a repo-wide sweep. E.164 phone storage; deactivate-never-delete. |
| tenants | Per-user language; settings JSONB w/ branding/agent/IVR/holiday room; tenant_phone_numbers from migration 0001. |
| voice/telephony | ADR-0019 seams honoured by earlier tracks: users carry presence-compatible identity (user_presence keys on users), notifications enum already includes agent_escalation, call_handoffs summaries deep-link into the Track A timeline; Track C's first migration owns ring_groups/routing_policies/call_handoffs/user_presence + call_queue callback fields + `transferred` outcome. |
| billing | usage_events full metric enum from day 1; entitlement guard is a decorator; proposal/project caps read COUNT over cycle window; read+export exemption in the guard. |
| crm/leads | consent/dnd/do_not_call/preferred_language on customers from day 1 (ComplianceGate reads them); source incl. inbound_call; snooze/dormant timestamps; multi-contact; merge-ready (survivor re-pointing touches no money tables). |
| survey | Versioned-append writes; a submission applied twice never produces a second record; photos = files rows w/ Tigris keys. |
| design | designs table lands with Track B's survey/design migration (Day 6–7); segments[] + projection persisted; fingerprints + structuralVerification columns; rules injected. Lead detail shows "Create design" disabled until Track D lands (day ~16), then enables — the flow slot exists from Day 6. |
| proposal/tranches | ONE tranches table = project collection schedule; Path A columns from Day 6; versions immutable; server numbers. |
| customer_links | Full A–F lifecycle + label + contact_id + otp_required from Day 7 (named links now in scope, used at launch). |
| catalog | Single resolver fixed/tested before proposal consumes it. |
| marketing | Per-contact, per-channel consent ledger + suppression list from the first migration (`M03-34`) — never a single consent flag on `customers`. `lead_source` is `text` validated against the market pack, never a closed enum, and never provider-named (`whatsapp` is a provider, not a source). Send runs, audiences and templates are tenant data, not code. |
| field workforce | Check-in/out, visits, attendance and geofence events are online-first — there is no queue and no device grace. Location rows carry `tenant_id` and a server-assigned timestamp; a day mark reads as recorded only once the server has it. Tracked-seat counting is a metered fact from day one (`M12-33`). |
| hr-lite | Employee records are tenant-scoped and deactivate-never-delete, matching the users rule. Leave and attendance reference the same `employee` row, never a duplicated person. Employee documents use the one `files` table. |
| notifications | Full type enum seeded Day 3 incl. agent_escalation, design_returned. |
| mobile | ALL data access behind repository interfaces, both platforms. **Satisfied since 2026-08-01**: the interfaces live in `@heliogrid/data` (ADR-0023), so swapping the data layer is one change, not one per platform. |
| domain subset | Pure TS + injected contexts from the first module; kernels dual-runtime (browser Worker + node worker_thread). |
| audit/files/jobs | audit_log from first mutation; one files table; BullMQ names namespaced. |

## Market & money — binding on EVERY module's first migration (2026-08-02)

The backend is global-capable with India the only launch market
(global-backend ruling, 2026-08-02). Unlike the per-module rows
above, this block applies to every module. Each first migration and contract must satisfy:

- **Money**: columns are `numeric(14,3)` named `*_amount` — never `*_inr`/`*_paise`; the
  money-bearing document root stamps `currency_code` at creation; sums reconcile to the
  currency's minor unit. Wire money is `amountSchema` + a document-level `currency_code`.
- **Tax**: fields are scheme-generic (`tax_pct`, `taxes[]`/`tax_breakdown`,
  `tax_registrations`) — never GST-named columns; statutory extras (IRN/SAC) live in
  scheme-tagged JSONB (`e_invoicing`).
- **Market vocabularies**: paperwork sets (document checklists, payment modes, mandate
  types) are `text` + Zod validated against the tenant market's pack — never closed pg
  enums. Canonical state machines stay pg enums with market-neutral value names; labels
  come from the pack.
- **Providers**: gateway/vendor refs are `provider` + `external_id` column pairs — never
  provider-named columns.
- **Scheduling**: user-facing repeatable jobs are tenant-timezone-aware, never fixed IST
  (platform-internal sweeps may stay fixed-clock).
- **New market onboarding** requires a privacy/residency determination for that
  jurisdiction BEFORE tenants are created there (docs/engineering/08 §9 is the IN determination), and
  selling subscriptions there needs a supplier-of-record decision (owner-blocked).
