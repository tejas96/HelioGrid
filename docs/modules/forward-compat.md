# Forward-compatibility register

> **Mandatory reading before any module's first migration or contract.** Each row states what
> a module must build in NOW so that a later module is not forced into a refactor.
>
> This is the anti-collision device that makes **Law 9** safe: a module may author only its
> own tables precisely because this register tells it which future needs its first migration
> must already satisfy. Without it, module-by-module growth becomes short-sighted rather than
> incremental.
>
> Extracted verbatim from `docs/14` §4 on 2026-07-30 so it can be cited and read without
> loading the whole build plan. `/roadmap` requires every module to restate its row.

Each register row is satisfied by its owning module's FIRST migration; migration 0001 covers
the identity/platform spine.

| Module | Build in NOW |
|---|---|
| auth/tenancy | Stackable roles M:N; JWT claims = PowerSync stream params; long-lived refresh for offline; E.164; deactivate-never-delete. |
| tenants | Per-user language; settings JSONB w/ branding/agent/IVR/holiday room; tenant_phone_numbers from migration 0001. |
| voice/telephony | ADR-0019 seams honoured by earlier tracks: users carry presence-compatible identity (user_presence keys on users), notifications enum already includes agent_escalation, call_handoffs summaries deep-link into the Track A timeline; Track C's first migration owns ring_groups/routing_policies/call_handoffs/user_presence + call_queue callback fields + `transferred` outcome. |
| billing | usage_events full metric enum from day 1; entitlement guard is a decorator; proposal/project caps read COUNT over cycle window; read+export exemption in the guard. |
| crm/leads | consent/dnd/do_not_call/preferred_language on customers from day 1 (ComplianceGate reads them); source incl. inbound_call; snooze/dormant timestamps; multi-contact; merge-ready (survivor re-pointing touches no money tables). |
| survey | Versioned-append = the PowerSync conflict strategy; assigned_to = stream partition key; photos = files rows w/ Tigris keys; sync_mutations exists from 0001. |
| design | designs table lands with Track B's survey/design migration (Day 6–7); the schema is frozen in docs/04 from Day 1; segments[] + projection persisted; fingerprints + structuralVerification columns; rules injected. Lead detail shows "Create design" disabled until Track D lands (day ~16), then enables — the flow slot exists from Day 6. |
| proposal/tranches | ONE tranches table = project collection schedule; Path A columns from Day 6; versions immutable; server numbers. |
| customer_links | Full A–F lifecycle + label + contact_id + otp_required from Day 7 (named links now in scope, used at launch). |
| catalog | Single resolver fixed/tested before proposal consumes it. |
| notifications | Full type enum seeded Day 3 incl. agent_escalation, design_returned. |
| mobile | ALL data access behind repository interfaces — Day 17 swap is a data-layer change only. |
| domain subset | Pure TS + injected contexts from the first module; kernels dual-runtime (browser Worker + node worker_thread). |
| audit/files/jobs | audit_log from first mutation; one files table; BullMQ names namespaced. |
