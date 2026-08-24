# SCR-M01-12 · Team

People with role chips, status, last-active; one-tap invite, deactivate, revoke; session revocation surface.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** team and role administration is EPC Owner-only (`F2.M01.manage-team` — M01 §2, §M01.2 permissions; the Team screen's read view follows the same grant in v1). The settings suite is web-emphasis, but one-tap acts — invite, deactivate — are first-class on mobile (M01 §2). This is also the session-revocation surface: deactivating a user, or a user's own "sign out everywhere", kills every device's session within ≤10 minutes (context: M01 §M01.1 / M01-07, not a row of this slice).

## Entry & exit

Reached from: the tenant administration area — the precise navigation is not pinned by PRD — designer decides, note the decision. Leads to: one-tap invite → Invite Teammate (SCR-M01-07); a person's role administration → Assign Roles (SCR-M01-13); the read-only Roles Reference (SCR-M01-14) sits beside these role-administration screens (M01 §M01.2). Revocation of a pending invite is one tap on this screen (M01 §M01.2 behavior detail).

## Requirements (verbatim)

### From `docs/prd/foundations/F2-roles-and-permissions.md`

- **F2-10** (P0) — **One person can hold several presets — stacking is the design.** The census states it: "Six fixed preset roles; one person may hold SEVERAL. Permission granted if any held role grants it; lead visibility takes the widest" (D27 — the count widens to twelve per DD3, the law is unchanged). The small-firm problem — one person is rep *and* surveyor *and* designer — is solved by stacking, never by building a custom role. The team list shows all roles a person holds as chips. _(non-UI half, build-side: stacking law: one person holds several presets, composed by OR — for awareness, not for drawing)_
- **F2-19** (P0) — **A tenant always retains at least one EPC Owner, and at least one person holding Manage team.** An owner removing their own admin rights, or the removal of the last Manage-team holder, is blocked with an explanation. Enforced as guarded transitions, not UI-only. _(non-UI half, build-side: guarded transition enforced beyond UI; blocked attempts audit-logged — for awareness, not for drawing)_

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-19** (P0) — **The Team screen** lists people with their role chips (all presets held, per F2-10), status (invited / active / deactivated) and last-active; one-tap invite and one-tap deactivate; deactivation warns about open work and prompts reassignment (F2-20). Blocked guard-rail attempts (removing the last EPC Owner or last Manage-team holder) explain themselves (F2-19) and are audit-logged (F2-22).

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **normal** — people with role chips (all presets held), status (invited / active / deactivated), last-active; one-tap invite and one-tap deactivate (M01-19, F2-10).
- **empty-teaching** — before anyone is invited, a teaching empty state per F7's empty-state contract (M01 §M01.1 behavior detail pattern), inviting the first teammate.
- **guard-rail-blocked** / **guard-rail-blocked-explained** — removing the last EPC Owner or last Manage-team holder is blocked with an explanation and the blocked attempt is audit-logged (F2-19, M01-19; M01 §M01.2 acceptance).
- **deactivate-warns-open-work-reassign** — deactivation warns about open work and prompts reassignment (M01-19).
- **deactivated-member** — a deactivated person's history remains attributed to them, their role chips and status render, and they are absent from assignment pickers (M01 §M01.2 acceptance).
- **pending-invite-revoke** — revocation of a pending invite is one tap on this screen (M01 §M01.2 behavior detail); invite states are pending / accepted / expired / revoked (M01-12 context, carried on SCR-M01-07).

## Data volume

The PRD pins no team-size number; design for the small-firm reality the stacking law names — one person is rep *and* surveyor *and* designer (F2-10) — through a list long enough to scroll, where each person may carry several of the twelve preset chips at once plus a status and a last-active value. Role names use localized capability phrases (M01 §M01.2 localization notes).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. User-visible here: each person's **last-active** date/time (M01-19) and the expiry on pending invites (M01-12 context). No money or business quantity renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state (teammate list readable from cache, read-only) and a matching read-cache sentence in Context of use. Both are deleted.*
