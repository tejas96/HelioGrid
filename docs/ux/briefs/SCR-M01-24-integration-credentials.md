# SCR-M01-24 · Integration Credentials

One place to see credential health: last-4 display, rotation, probe status, links to owning modules' connect flows.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only, security-sensitive settings work, web-emphasis at a desk (M01 §2), fully mobile-capable — the persistent nag must reach the owner wherever they are. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); credential lifecycle events and every decrypt are audit entries (M01 §M01.10 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Integration credentials* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: the credentials surface links each credential to its owning module's connect flow — M11 gateway connect; M07 number/BYO flows — M01 provides the one place to see credential health (§M01.10 behavior detail).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-60** (P0) — **Integration credentials are write-only, shown as last-4, probed, and never fail silently.** Tenant-supplied credentials (the BYO payment gateway of `modules/M11`; tenant-side messaging/voice credentials where M07 defines them) display last-4 only after entry; every platform decrypt is audit-logged; credentials are probed on a schedule and an invalid credential raises an alert plus a persistent settings nag — never silent failure. Credentials are the tenant's to rotate. _(non-UI half, build-side: write-only credential storage, scheduled probes, every decrypt audit-logged — for awareness, not for drawing)_

## States

- **Loading** — credential list and probe statuses loading.
- **Empty** — no credentials connected yet; teaching treatment per F7's empty-state contract, pointing to the owning modules' connect flows (§M01.10 behavior detail).
- **Error** — a save or rotation fails; what happened and what to do next.
- **last4-only** — a stored credential renders at most its last-4; no read-back exists (M01-60 acceptance: "at most last-4 is visible and no read-back exists").
- **probe-failed-alert** — the scheduled probe detects an expired/revoked/invalid credential: an alert fires; dependent surfaces state the failure honestly rather than erroring blind (M01-60; §M01.10 edge cases, `DOC09` status-honesty).
- **persistent-nag-until-rotated** — a settings nag persists until the credential is rotated (M01-60 acceptance); credentials are the tenant's to rotate.

## Data volume

A short credential list: the BYO payment gateway credential (M11's) and tenant-side messaging/voice credentials where M07 defines them (M01-60) — single-digit rows, each with last-4, probe status, and a link to its owning module's connect flow.

## Numbers carrying provenance

- **The last-4 of each credential** — the only visible fragment of a write-only stored value (M01-60); carries its F8 provenance tier in the design.
- **Probe status per credential** — the scheduled probe's result driving alert and nag states (M01-60); its recency/result is a system-derived fact and carries its F8 provenance tier in the design.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
