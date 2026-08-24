# M12 · Platform billing

Status: draft · Origin mix: SRC (docs/16 billing mechanics, docs/01 enforcement halves, docs/04
billing records) with `BRIEF` only where V2 meters extend the set · Depends on: `00-README.md`,
`01-product-overview.md`, `04-business-model.md`, `foundations/F1-global-market-framework.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F4-data-integrity.md`,
`foundations/F8-data-honesty.md`, `modules/M11-payments-and-collections.md`

## 1. Purpose & scope

This module is the platform side of money: the tenant pays the platform. It owns the
subscription lifecycle machine and what every state means for users, entitlements as the
product's **only** runtime gating, every enforcement point and its denial experience, the usage
ledger and the usage screen, the dunning ladder, subscription invoicing, refunds and plan
changes, the trial's mechanics, and the always-available billing screens. The commercial law it
enforces — tier names, prices, caps, bundles, the soft-block law and the state capability
matrix — is defined once in `04-business-model.md` (`BM-09`'s discipline); this module
implements those numbers and laws and defines none of them.

**What this module is not.** It is not the tenant's own collections — the homeowner or factory
paying the EPC is `modules/M11`'s system, on the tenant's own account, and the two never mix
(M12-01). It is not a pricing document (04's), not a feature-flag system (none exists — M12-15),
and not a lever against the tenant's data: in every state without exception, read, search,
dashboards, export, customer links and the billing screens themselves keep working (`BM-32`,
enforced here).

## 2. Personas & surfaces

- **EPC Owner** — the only persona that manages billing: plan, cycle, payment method,
  reactivation, cancellation (`F2.M12.manage-billing`, v1 matrix carried). The usage screen and
  invoices are theirs (M12-36). Web-emphasis for plan/mandate/invoice work; the dunning
  banner, trial countdown and one-tap pay are fully mobile.
- **Sales Manager** — sees the dunning banner alongside the Owner (`DOC16.dunning-channels`'
  named audience) — informed, not empowered; no billing act.
- **Every employee persona** — experiences billing state only as honest surfaces: the state
  banner, a typed blocked-mutation message with a reactivate route they may not themselves
  take, and nothing else. No employee surface shows amounts.
- **The EPC's customer — never.** No billing state, banner, dunning message or enforcement
  surface ever reaches a customer link (`F5-23`/`F5-60` reciprocated at M12-29).
- **Finance** — deliberately excluded: Finance's money scope is the tenant's customers' money
  (M11), never the platform bill (F2 §F2.5-M12 note, `PS-31` boundary).

## 3. Feature areas

### M12.1 — Scope: the two money systems, and whose numbers these are

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-01 | **Two money systems that never mix — this module is the platform side.** (1) Platform SaaS billing: the tenant pays us, on our merchant account, under this module. (2) Tenant customer-collections: the customer pays the EPC via the tenant's own gateway account, under `modules/M11`. The platform never touches tenant funds; no surface here shows a collections figure, no total mixes the two, and the vocabularies stay disjoint — *subscription, plan, invoice* here; *collections, tranches, receipts* there (`M11-02`'s reciprocal). | `SRC` — `DOC16.two-money-systems` (docs/16 §0; the collections half is `modules/M11`'s per Task 19); `BM-02` consumed | P0 |
| M12-02 | **Every number this module enforces is `04-business-model.md`'s.** Tier names (`BM-11`), prices/caps/bundles (`BM-41` for the launch book), the meter list (`BM-16`–`BM-22`), the billing-state vocabulary (`BM-33`), the soft-block law and matrix (`BM-32`–`BM-36`), cap law with the 80% pre-warning (`BM-34`), trial law (`BM-28`–`BM-31`), grandfathering (`BM-42`) and the supplier-of-record posture (`BM-40`) are defined there once. This module adds transitions, timers, gates, screens and records — never a second definition of any fact. | `SRC` — `DOC16.pricing-single-source` (docs/16 §0: "one definition per fact"); `BM-09` consumed | P0 |
| M12-03 | **Billing is provider-neutral; the launch market's gateway is a reference implementation.** Subscription billing, mandates, hosted checkout and webhooks are capabilities behind provider-neutral billing ports; the billing schema is per-currency and provider-neutral, one currency per tenant (`F1-07`/`F1-27` consumed). The v1 reference implementation is Razorpay (`R4`, the IN rail) — named here once, as reference implementation only; another market adds adapters, never product change. | `SRC` — `R4` (docs/15 §1 — the M12 half; IN rail facts `F1-40`, Task 6); `DOC16.plan-objects` (provider-neutral note); vendor rule per Global Constraint §6 | P0 |

**Behavior detail.** The separation is structural, not stylistic: M11's screens never render a
subscription state and this module's screens never render a tranche. The one place the two
systems appear near each other — the Owner's settings — keeps them as two entries with two
vocabularies. Where this document names an IN fact (a rail, a tax scheme, a template rule), it
does so by pack key (`F1-40`, `F1-28`, `F1-38`) with the fact living in F1.

**Edge cases & what-goes-wrong.**

- *A tenant's customer somehow reaches a billing surface* → cannot happen: billing screens
  exist only behind tenant authentication with `F2.M12.manage-billing`; links carry no route
  here (M12-29).
- *A second market launches* → new plan-price rows and a new pack; no requirement in this
  module changes (M12-03, `BM-38` consumed).

**Acceptance criteria.**

- Given every surface in this module, when audited for content, then no collections figure,
  tranche or customer-payment fact appears, and vice versa for M11 (M12-01).
- Given any price, cap or bundle rendered here, when traced, then it resolves to the market
  book via entitlements and to no constant of this module's own (M12-02).
- Given the module body, when searched for vendor names, then the only occurrence is M12-03's
  reference-implementation naming (M12-03).

**Localization notes.** All billing copy EN/HI/MR; amounts render in the tenant's one currency
with its market grouping (`F1-27`, `F3-20`). **Analytics events:** none of its own here —
areas below carry theirs.

### M12.2 — The subscription lifecycle machine

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-04 | **The lifecycle is one machine, six states, history append-only:** `trialing` → (pay) `active` · `trialing` → (14 days unconverted) `expired` [terminal] · `active` → (charge fails) `past_due` → (7 days unpaid) `halted` → (payment) `active` · `active` → (owner cancels) `cancelled` (runs to the paid period end, then behaves as `halted`). One non-terminal subscription per tenant. The six names are `BM-33`'s suite vocabulary and no other state name exists anywhere. | `SRC` — `DOC16.lifecycle-states` (docs/16 §2); `DOC04.subscription-states` (docs/04); names fixed at `BM-33` | P0 |
| M12-05 | **`active` means the mandate is live and the current period paid.** Entitlement extends to the period end **plus a 3-day buffer** for webhook lag, so a tenant is never blocked by our plumbing being slow. | `SRC` — `DOC16.entitled-buffer` (docs/16 §2) | P0 |
| M12-06 | **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7. | `SRC` — `DOC16.past-due-grace` (docs/16 §2); matrix law `BM-33`/`BM-35` consumed | P0 |
| M12-07 | **`expired` is terminal and behaves exactly as `halted`:** soft-block, data retained indefinitely, reactivation permanently offered. Terminal means "the trial cannot resume" — never "the tenant is done". | `SRC` — `DOC16.trial-expired-terminal` (docs/16 §2) | P0 |
| M12-08 | **Reactivation is always available, from every dead state.** `halted` / `expired` / `cancelled` → `active`: the owner pays from the always-available billing screen; a **new** gateway subscription is created — a halted subscription is never resumed, one live mandate at a time; entitlements are active immediately on confirmation; all data is intact regardless of how long the tenant was halted. | `SRC` — `DOC16.reactivation` (docs/16 §2); `BM-30`/`BM-32` consumed | P0 |
| M12-09 | **A successful charge is the source of truth for entitlement.** It extends the entitled window, writes the payment, triggers the tax invoice and clears dunning — atomically from the tenant's point of view. Stale or out-of-order gateway events can never regress state; a reconcile-by-poll backstop (every 6 h) repairs drift, and every repair raises an internal alert — reconciliation is supposed to be boring. | `SRC` — `DOC16.entitlement-truth` (docs/16 §2); reconcile cadence per `DOC02.trigger-schedule` (M12 half — the M07-visible timers were Task 17's) | P0 |
| M12-10 | **Checkout is the gateway's hosted flow; the platform never sees a payment instrument.** Card, mandate and bank details exist only at the gateway (the market's localisation obligations stay the gateway's problem — IN instance per `F1-43`). The product's own screens collect nothing sensitive. | `SRC` — `DOC16.hosted-checkout` (docs/16 §2); IN residency facts `F1-43` (cited) | P0 |
| M12-11 | **The mandate is established at conversion, never at signup, on the market pack's rails.** Which rail collects which cycle is pack data (`F1-40`/`F1-41` for IN: mandate ladder for monthly self-serve; e-NACH/invoice for Enterprise; every yearly total exceeds the mandate cap and is collected as a single payment link/invoice per year, renewal a fresh invoice). Pre-debit notifications before each charge are the gateway's duty; dunning copy may reference them and builds nothing. | `SRC` — `DOC01.mandate-at-conversion` + `DOC01.yearly-payment-rail` (docs/01 — the mechanics halves; laws at `BM-29`/`BM-13`); `DOC16.mandate-routes` + `DOC16.mandate-ladder` (docs/16 — the M12 halves; IN rails `F1-40`/`F1-41`, Task 6) | P0 |
| M12-12 | **Every tier exists as two gateway plan objects (monthly + yearly), mirrored 1:1 by per-currency plan-price rows.** Our tables are the source of truth for entitlements; the gateway's for money. A cycle switch (monthly → yearly) follows exactly the tier-upgrade mechanics: immediate entitlements, prorated delta, new subscription at the boundary (M12-48). | `SRC` — `DOC16.plan-objects` (docs/16 §2); `DOC04.plan-prices-per-currency` consumed via `BM-38` | P1 |
| M12-13 | **Pause/resume is not offered.** No pause state exists in the machine; if the gateway ever emits such an event it is logged and alerted, never applied. | `SRC` — `DOC16.pause-resume-not-offered` (docs/16 §2) | P1 |
| M12-14 | **Signup carries no billing step — billing's first appearance is the trial state itself.** Self-serve signup stays phone + OTP + company (D11's surviving half, M01's flow); no plan choice, no card, no mandate at signup (`BM-28`/`BM-29` consumed). The census's post-strike "no trial gate… anywhere" text is dead — the overlay's trial-only model governs, and the trial state, countdown and conversion surfaces (§M12.9) are exactly where billing first becomes visible. | `SRC` — `D11` (census, amended — the billing half lands here per the ledger's contradiction note; signup half `M01-01`/`M01-11`, Task 12); `S0.notv1.1` (superseded text — the billing-surfaces half; trial law `BM-28`) | P0 |

**Behavior detail.** The machine's user-visible face is the state banner: one line, honest,
present in every non-`active` state, naming the state, what changes and the one action that
resolves it (pay / update method / reactivate). Transitions the tenant causes (pay, cancel,
reactivate) confirm inline; transitions time causes (grace phases, halt) announce through the
dunning ladder (§M12.6). Subscription history — every state entered, when, why — is append-only
and readable on the billing screen; billing plan changes, subscription transitions and
entitlement overrides are audit-covered events (`F2-22` consumed).

Permissions: every act in this area is `F2.M12.manage-billing` (EPC Owner). State banners
render for all employees; acts render only for the Owner.

**Edge cases & what-goes-wrong.**

- *Charge fails while the owner is abroad/unreachable* → the 7-day grace and the ladder buy
  time; nothing hard-blocks at any point, and reactivation works whenever they surface
  (M12-06, M12-08).
- *Webhook arrives late or twice* → cannot regress state or double-extend: the charge event is
  idempotent and the reconcile backstop repairs drift with an alert (M12-09).
- *Owner cancels then changes their mind before period end* → service is still running
  (`cancelled` runs to period end); reactivation from the billing screen re-establishes a live
  subscription (M12-08).
- *Gateway outage at conversion* → conversion fails honestly (`F8-36`); the trial state is
  unchanged; nothing half-converts (M12-09's truth rule — no charge, no entitlement change).

**Acceptance criteria.**

- Given any tenant at any moment, when its subscription state is read, then it is exactly one
  of the six `BM-33` names, its history is append-only, and at most one non-terminal
  subscription exists (M12-04).
- Given a paid period ending with a slow webhook, when the period end passes, then entitlement
  persists through the 3-day buffer and no user sees a block (M12-05).
- Given a charge failure, when days 0–3 elapse, then everything works with a banner; when day
  4 arrives, then exactly the metered features pause; when day 7 passes unpaid, then the state
  is `halted` with the matrix's always-on rows intact (M12-06).
- Given a tenant halted for a year, when the owner pays, then a new gateway subscription
  exists, entitlements are live immediately, and every record is as they left it (M12-08).
- Given a successful charge, when it lands, then window + payment + invoice + dunning-clear
  all follow from that one event, and no out-of-order event can undo it (M12-09).
- Given signup, when the flow completes, then no billing step occurred and the tenant is
  `trialing` with the trial's caps (M12-14).

**Localization notes.** State names are internal vocabulary; user-facing state copy is
translated and honest (`F8-34`). **Analytics events:** state entered (BM-33 vocabulary) ·
grace phase transition · reactivation started/completed · conversion started/completed.

### M12.3 — Entitlements: the only runtime gating

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-15 | **There are no feature flags in this product; the single runtime gate is billing entitlements.** Features ship enabled when merged. A user's feature availability is determined only by plan entitlements (ceilings and booleans) plus usage allowances (metered bundles) — no per-tenant toggles, no beta flags, no dark launches, anywhere. | `SRC` — `DOC16.no-feature-flags` / `OD-8` / `DOC00.nongoal-feature-flags` (the M12 halves — `00-README`/`01` carry the principle; this row is its enforcement home) | P0 |
| M12-16 | **Entitlements are the current effective limits per key, recomputed on every charge and plan change**, sourced from plan, trial, or a manual grant — and queried on the hot path by every gate. No mechanism in the entitlement model can hold data hostage: read + export work regardless of any entitlement value. | `SRC` — `DOC04.entitlements-current` (docs/04, verbatim posture) | P0 |
| M12-17 | **Plans carry trial days and the included bundles** (voice minutes, AI detections, OTP fair-use — not billed v1, storage, plus the V2 meters); capacity ceilings (single-design kW, proposal counts, Starter's active projects) live in the plan definition. Seats are reserved and always unlimited — no per-seat pricing exists (the sole seat-counting exception is the tracked-seat add-on, `BM-22`, metered in §M12.5). | `SRC` — `DOC04.plans-bundles` (docs/04); values are book data (`BM-41`) | P0 |
| M12-18 | **Entitlement checks run before the action; metering never blocks the action.** Billable usage (voice, detections) checks entitlements first; the metering write itself never fails or delays the request it records. Non-billable metrics are still metered for quotas and cost visibility. | `SRC` — `DOC07.metering-entitlement-order` (docs/engineering/07) | P0 |
| M12-19 | **Support-issued goodwill credits are entitlement-override records — audited, never manual edits.** Every override names who, what, why and when, and appears in the audit log (`F2-22`'s "entitlement overrides"). | `SRC` — `DOC16.goodwill-credits` (docs/16 §2) | P1 |
| M12-20 | **Ceilings gate at product boundaries, never inside engines — CONFIRMED FINAL (owner rulings 2026-08-04, Q28/Q29).** No kW clamp exists inside the design engine: the single-design ceiling is a billing entitlement enforced at M12-21's checkpoints only (`DOC05.no-kw-clamp`). The owner confirmed both formerly open restraints as law: **Q28** — **zero feature gates in the studio**; the design-kW ceiling is the only gate, enforced at Save/Generate (never mid-edit), over-ceiling designs readable forever, and no studio entitlement key beyond it exists; **Q29** — the **OPEX/PPA proposal type is ungated on every tier** (the never-gate-features law holds; the kW ceiling applies naturally) and **no proposal-type entitlement key exists**, ever, in this module. | `SRC` — `DOC05.no-kw-clamp` (docs/05); Q28/Q29 confirmed final per owner rulings 2026-08-04 | P0 |

**Behavior detail.** Entitlement denial is a **typed, honest experience**, one shape
everywhere: what was attempted, which limit or state denied it, what still works, and the one
action that resolves it (upgrade / reactivate / wait for the cycle). Denial copy follows
`F8-34` — it names exactly what paused and never threatens what will not happen. The
conformance test `01-product-overview.md` states stands: a feature flag anywhere is a defect
(`OV-27`/`OV-28` consumed).

**Edge cases & what-goes-wrong.**

- *A capability needs staged rollout* → it does not merge until it ships whole (OD-8's
  discipline, process-side); the product never grows a flag to fake it (M12-15).
- *Support wants to unblock a tenant* → a goodwill entitlement override, audited (M12-19) —
  never a DB edit, never a flag.
- *Two gates could both deny (state + cap)* → the state gate answers first (it is the broader
  fact), and the message names the state, not the cap (M12-21's family).

**Acceptance criteria.**

- Given the whole product, when searched for runtime gating, then every gate resolves to a
  billing entitlement or billing state and nothing else (M12-15).
- Given a plan change or charge, when it commits, then effective entitlements recompute in the
  same act and every subsequent check uses them (M12-16).
- Given a metered action within allowance, when the meter write fails internally, then the
  action still succeeds and the miss is repaired by reconciliation — never a user-facing
  failure (M12-18).
- Given the entitlement key set, when audited, then no key gates a studio capability beyond
  design-kW and none references a proposal type (M12-20 — confirmed final, owner rulings
  2026-08-04 Q28/Q29).

**Localization notes.** Denial copy translated in every launch language, honest per `F8-34`.
**Analytics events:** entitlement denial shown (gate, state/limit) · override issued.

### M12.4 — The soft-block gates: state machine enforcement, point by point

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-21 | **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law. | `SRC` — `DOC16.gate.state-guard` + `DOC16.soft-block-never-hard` (docs/16 §3/§5 — the enforcement halves; the law `BM-32`/`BM-35`) | P0 |
| M12-22 | **The always-on set is enforced as unconditional:** in every state including `halted`, `expired` and post-period `cancelled` — read everything, search, dashboards; export (CSV, data export, existing proposal PDFs, invoices); customer links (view **and** respond) and progress pages; billing screens with pay/upgrade/reactivate. The gated set pauses only at `halted`/`expired`/`cancelled`(post-period): create/edit of leads, tasks, activities, surveys; studio create/edit (read-only open always works); generate/send proposals, mark won/lost, project updates; file/photo uploads. Metered features pause from `past_due` day 4; team invites (OTP spend) block from day 4. | `SRC` — `DOC16.softblock.always-on`, `DOC16.softblock.core-gated`, `DOC16.softblock.metered-pause`, `DOC16.softblock.invites` (docs/16 §3 — the enforcement halves re-appended per Task 11's routing; the product-law matrix is `BM-32`–`BM-35`) | P0 |
| M12-23 | **The enforcement-point table is closed — where each gate fires, and what denial looks like:** see the table below. No gate exists at any other point; in particular nothing fires mid-edit, per-keystroke, or on read. | `SRC` — `DOC16.gate.design-kw`, `DOC16.gate.proposal-count`, `DOC16.gate.active-projects`, `DOC16.gate.voice`, `DOC16.gate.ai-detection`, `DOC16.gate.storage` (docs/16 §5 — the gate-mechanics halves; surface halves at `M05-12`, `M06-26`, `M08-07`, `M07-37`/`M07-50`, `M04-23`) | P0 |
| M12-24 | **The never-gated list is law:** reads · search · exports · customer links · billing screens · **engineer sign-off on already-submitted designs** (a safety workflow) · the upload of photographs already captured in the field. No enforcement design may touch any of them, in any state, for any cap. | `SRC` — `DOC16.never-gated` (docs/16 §5); the field-photograph clause is that key's surviving instance after the offline/sync capability was deleted (owner decision 2026-08-07) | P0 |
| M12-25 | **When halted, inbound agent calls degrade to a missed-call log + voicemail** — no AI minutes burn, the caller is never told about billing, and the degradation surface is `modules/M07`'s (`M07-50`); this module owns the state that triggers it. | `SRC` — `DOC16.halted-inbound-degrade` (docs/16 §3 — the billing-state half; surface `M07-50`, Task 17) | P0 |
| M12-26 | **A photograph already captured in the field always uploads, in every billing state.** The block is on new mutations from the interface, never on the upload of a photograph the field user has already taken — the one piece of work the product holds on the device (`F4-21`). No gate may inspect, delay or refuse that upload, and reads work while blocked. | `SRC` — `DOC16.offline-drain-never-blocked` (docs/16 §3 — the enforcement half; its surviving instance after the offline/sync capability was deleted is the photo carve-out, owner decision 2026-08-07, `F4-21`) | P0 |
| M12-27 | **New field capture is never cut off before `halted` (owner ruling 2026-08-04, Q16).** No enforcement mechanic cuts off new field capture during dunning — capture works through the **full dunning grace** (the `past_due` window, M12-39) and **pauses only at `halted`**; a **halt that lands mid-visit lets the current visit complete** ("never strand a surveyor on a roof"); reads, exports and the upload of already-captured photographs are unchanged, always-on (M12-24, M12-26). | `SRC` — `DOC06.entitlement-grace` (docs/06 — the enforcement half); capture-through-grace + finish-the-visit rule per owner ruling 2026-08-04 (Q16) | P0 |
| M12-28 | **Read + export always work — the pre-committed law, enforced here.** "Never hold a customer's data hostage": tenant-level read and export work in every billing state, and trial expiry pauses only new creation. This is the one clause of the dead deferred-era billing section that survives, kept verbatim, and it outranks every enforcement idea. | `SRC` — `BILL.2` (journey L1361–1362 — the enforcement half; law `BM-32`); `D38` (superseded — its kept pre-commitment); `DOC01.trial-soft-block` (docs/01 — the enforcement half; law `BM-30`) | P0 |
| M12-29 | **No billing surface, state, or dunning behaviour ever reaches a customer link.** Links stay live — view and respond — in every state; the EPC's customer never learns the EPC's billing state from us. `foundations/F5` states the standing constraint (`F5-23`, `F5-60`); this module is bound by it at every gate. | `SRC` — `DOC08.link-never-billing-blocked` via `BM-32`'s matrix row (cited; F5 owns the link law) | P0 |
| M12-30 | **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting. | `SRC` — `DOC01.cap-soft-block` (docs/01 — the per-gate enforcement half; the law `BM-34`, which carries the 80% pre-warning as `F8-33`'s instance) | P0 |
| M12-31 | **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited". | `SRC` — `DOC16.dunning-ladder` day-4 clause (docs/16 §7) + `F8-34` consumed | P0 |

**The enforcement-point table** (product-level; the surface halves live in the named modules):

| Gate | Fires at | Never fires at | Denial experience |
|---|---|---|---|
| Design kW ceiling | Design save/creation · proposal Generate | Mid-edit, per-keystroke — "the flagship is never interrupted"; opening existing designs | Save blocked with upgrade prompt; existing designs always open (`M05-12`) — **confirmed as the studio's only gate, owner ruling 2026-08-04 (Q28)** |
| Proposal count / month | Proposal create only | Editing, duplicating, sharing existing proposals; reads/exports | 80% banner → 100% banner + 7-day grace → new creation pauses with upgrade/cycle note (`M06-26`) |
| Active projects (Starter) | Mark-won → project create | Anything on existing projects — never strand a live installation | Mark-won blocked with upgrade prompt; existing projects fully workable (`M08-07`) |
| Voice minutes | Queue insert **and** again before dial | Mid-call | Blocked entry marked + owner notified; AI-inbound over allowance falls to ring group/voicemail per tenant IVR (`M07-37`, `M07-50`) |
| AI roof detection | Server-side, before the call | Manual outlining — always free, always available | Detection blocked with the manual path offered (`M04-23`'s surface) |
| Storage | Upload issuance, only above ceiling × 1.1 (10% soft headroom) | Reads, exports, existing files | Upload blocked with the gauge shown honestly |
| Team invites | Invite send, from `past_due` day 4 | — | Invite blocked with the state named (`DOC16.softblock.invites`) |
| Billing state (all mutations) | Every UI mutation, per the matrix | The always-on set (M12-22) and the never-gated list (M12-24) | Typed error + state banner + reactivate route (M12-21) |

**Behavior detail.** The matrix binds state → capability groups; F2 still decides *who* may act
— billing state never widens or narrows a permission (`BM-35`'s permissions note). Gates
compose with one rule: the broadest true fact speaks (state before cap, cap before bundle), so
a user never gets two banners for one act.

**Edge cases & what-goes-wrong.**

- *A queue entry outlives its allowance* → caught by the re-check before dial; the entry is
  marked, the owner notified, nothing dials on a dead allowance (table row; `DOC16.gate.voice`).
- *A field crew returns from a dead zone after the tenant halted* → the photographs they already
  captured still upload, and reads work; new UI mutations show the banner (M12-26, `BM-36`).
- *An engineer must sign off a submitted design while the tenant is halted* → works; safety
  outranks billing (M12-24).
- *A tenant at 100% of proposals mid-deal* → 7-day grace exists precisely for this; editing
  and duplicating existing proposals never paused (M12-30, table row).
- *Storage exactly at ceiling* → uploads still pass until ceiling × 1.1; the gauge and the
  usage screen said so at 80% (table row, M12-34).

**Acceptance criteria.**

- Given any state in the matrix and any capability row, when M12's enforcement is audited row
  by row, then no ✓ has become a block and no block has widened (M12-21, M12-22).
- Given each gate in the enforcement-point table, when its fire point and denial are tested,
  then they match the table exactly and no other enforcement point exists (M12-23).
- Given every item on the never-gated list in every billing state, when exercised, then it
  works (M12-24).
- Given a photograph already captured in the field on a tenant in any billing state, when it
  uploads, then no gate delays or refuses it; and given new field capture during dunning, then it
  continues — pausing only at `halted`, with a visit under way allowed to complete
  (M12-26, M12-27; owner ruling 2026-08-04 Q16).
- Given a cap reaching 80%, when the usage screen renders, then the pre-warning is present
  before any gate has fired (M12-30, M12-34).

**Localization notes.** Banner and denial copy translated; the "what still works" list renders
in the viewer's language. **Analytics events:** gate fired (which, at what point) · grace
started/ended · blocked-mutation shown (per gate).

### M12.5 — Usage metering & the usage screen

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-32 | **The ledger is the bill.** Usage metering is an append-only ledger and no other counter exists: every event carries provenance (the call, the detection, the send, the document) and an idempotency key, so a retried job or duplicate webhook can never double-meter; rollups are always reproducible from the ledger — the same discipline as the money path. Internal cost estimates are never customer-facing. | `SRC` — `DOC16.usage-ledger` (docs/16 §6); `DOC04.usage-ledger` (docs/04, verbatim posture) | P0 |
| M12-33 | **Metering rules, per meter:** voice minutes — one event per completed call, every call ledgered; AI detections — bill only when a result was returned, failures never bill; OTP — tracked for cost visibility, fair-use capped, **not billed in v1**; storage — a nightly gauge snapshot, never a counter; **tracked seats (V2)** — tracked-seat-months from the owner's toggle events (`M09-04`), with month-fraction arithmetic owned here; **marketing sends (V2)** — per-channel send events against the book's bundles (`BM-21`, `M03`'s surfaces). | `SRC` — `DOC16.metering-rules` (docs/16 §6); V2 meters `BRIEF` — design spec §8/DD7 via `BM-21`/`BM-22` (consumed) | P0 |
| M12-34 | **The usage screen shows exactly the rollups the product enforces and bills from** — same query, same numbers, no smoothing — each figure labelled with the period it covers and described in **plain "actual usage" language** (owner ruling 2026-08-04, Q9: the provenance word "measured" is reserved for engineering/survey data and does not appear on usage or billing screens; `F8-33`'s law, whose screen this is). **The 80% pre-warning is a gate-side obligation:** when any bundle or cap is 80% consumed the screen says so **before** the gate ever fires, and no gate in §M12.4 may fire without that pre-warning having been available on this screen. | `SRC` — `DOC16.usage-honesty` (docs/16 §6 — the gate-mechanics half re-appended per Task 7's routing; the honesty law is `F8-33`); plain-language wording per owner ruling 2026-08-04 (Q9) | P0 |
| M12-35 | **Overage accrues visibly and bills on the next invoice.** Voice minutes and detections beyond bundle bill at the book's published per-unit rates as add-ons on the next subscription invoice; the usage screen shows accruing overage as it happens, in the tenant's currency with its market grouping. | `SRC` — `DOC16.overage` (docs/16 §6); rates are book data (`BM-41`) | P0 |
| M12-36 | **The usage screen is owner-scoped and informational** — per-period rollups against bundles with plain overage pricing, deep links to ledger detail, "no scary meters". | `SRC` — `UXG-15` (ux-gap register, faithful notes: "informational, tenant-scoped, owner-only") | P1 |
| M12-37 | **Proxied third-party services are metered per tenant with quotas — as platform cost lines, not tenant bills.** The imagery/energy/AI services the product proxies are server-proxied with per-tenant metering and quotas so a runaway tenant cannot torch margin; none of these appear on the tenant's bill (the billed meters are M12-33's closed set). | `SRC` — `R5` (docs/15 §1 — the per-tenant-metering half routed here by Tasks 7/14/15); `DOC01.metered-bundles` quota note (cited — 04 owns the COGS posture) | P1 |
| M12-38 | **The agent usage view reads this ledger — the same numbers as billed.** `modules/M07`'s usage view (`M07-59`) and any dashboard usage figure (`modules/M13`) read M12's rollups; whether a cap applies is entitlement data from here; the deferred-era "no plan cap by design" claim is dead and appears nowhere. | `SRC` — `AP.screen.3` (journey L1340 — the M12 half; screen halves `M07-59`/M13) | P0 |

**Behavior detail.** The ledger is invisible plumbing with two honest faces: the usage screen
(owner) and the invoice's overage lines. Both read the same rollups; a discrepancy between
them is a defect by definition (`F8-33`). Tracked-seat-months accrue from toggle-on to
toggle-off per person with month fractions; the usage screen shows current tracked seats and
the accruing seat-months beside every other meter.

**Edge cases & what-goes-wrong.**

- *A detection returns nothing* → not billed, and the ledger records the failure event for
  cost visibility (M12-33).
- *A duplicate webhook re-reports a call* → idempotency key makes it a no-op (M12-32).
- *The book has no value for a V2 meter slot* → the meter exists but cannot be sold (`Q1`);
  the usage screen shows activity with no rate rather than inventing one (`BM-41`'s slots,
  consumed).
- *Owner disputes a figure* → the ledger's provenance answers it: every unit traces to its
  event (M12-32).

**Acceptance criteria.**

- Given any usage figure on the usage screen, when compared with what enforcement checks and
  the invoice bills, then all three come from the same rollup of the same ledger (M12-32,
  M12-34).
- Given a bundle at 80%, when the usage screen renders, then the pre-warning is present, and
  no §M12.4 gate for that meter has fired yet (M12-34).
- Given overage accruing, when the next invoice issues, then its add-on lines equal the
  ledgered overage at the book's published rates (M12-35).

**Localization notes.** Meter names and period labels translated; amounts in tenant currency
with market grouping (`F1-27`/`F3-20`). **Analytics events:** usage screen viewed · 80%
warning shown (meter) · overage accrual started.

### M12.6 — Dunning: the honest ladder

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-39 | **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04, Q43):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it. | `SRC` — `DOC16.dunning-ladder` (docs/16 §7); forfeiture disclosure per owner ruling 2026-08-04 (Q43) | P0 |
| M12-40 | **Dunning channels are the market pack's stack, and platform→tenant messaging is ours to send.** The IN stack: in-app banner (owner + managers), push, SMS on registered templates (`F1-38`), and a business-messaging utility template where the owner opted in. D32 constrains tenant→customer messaging only — it does not restrict the platform messaging its own tenants. A future market's pack names its own channel stack. | `SRC` — `DOC16.dunning-channels` (docs/16 §7; IN channel facts ride `F1-38`) | P0 |
| M12-41 | **All dunning copy is honest about state — no data-deletion threats, ever, because nothing is deleted.** Copy names the state, the consequence that will actually occur, and the resolving action; pre-debit notifications are the gateway's and may be referenced, not imitated. Consequences that **will** occur include the grandfathering forfeiture where the tenant is protected (owner ruling 2026-08-04, Q43): dunning and win-back copy names the price-protection loss honestly, and win-back offers never imply the old price survives the lapse. | `SRC` — `DOC16.dunning-honesty` (docs/16 §7 — the copy/ladder half; the honesty law `F8-34`, Task 7); forfeiture honesty per owner ruling 2026-08-04 (Q43) | P0 |
| M12-42 | **Trial nudges reuse the dunning pipeline:** day 7 ("half way"), day 12, day 14 (expiry) — same channels, same honesty. | `SRC` — `DOC16.trial-nudges` (docs/16 §7) | P1 |
| M12-43 | **The billing timers are fixed product timers:** the trial-expiry sweep flips entitlements to the soft-block set (read + export always work); reconciliation runs its 6-hour cadence. Carried as product timers, not calendar language. | `SRC` — `DOC02.trigger-schedule` (docs/engineering/02 — the M12 half per Task 17's routing note) | P1 |

**Behavior detail.** The ladder is state-driven, not schedule-driven: a successful payment at
any rung clears all pending rungs instantly (M12-09). Messages deep-link to the billing
screen's one action. The dunning notification types register in `foundations/F6`'s matrix
(billing events — owner-facing, with the banner additionally visible to Sales Managers);
nothing dunning-related ever reaches a customer link (M12-29).

**Edge cases & what-goes-wrong.**

- *Owner pays at day 6* → `active` immediately; day-7 rung never fires; banner clears
  everywhere within the entitlement recompute (M12-09, M12-39).
- *The market's SMS templates are still in registration* → activation-clock law: the channel
  activates when registered; in-app + push carry the ladder meanwhile (`F1-38`'s
  activation-not-scope law, consumed).
- *Tenant halts and stays halted for months* → weekly × 4 then monthly, forever; the copy
  never escalates beyond the truth (M12-39, M12-41).

**Acceptance criteria.**

- Given a first failed charge, when the ladder runs unpaid to day 7, then each rung fires
  with its stated content, day 4's message names the paused set exactly, and day 7's confirms
  what still works (M12-39, M12-41).
- Given all dunning copy in all languages, when audited, then no message threatens deletion
  or any consequence that will not occur (M12-41).

**Localization notes.** Ladder copy exists in every launch language (`F3`); SMS rides the
market's registered templates (`F1-38`). **Analytics events:** dunning rung fired (day) ·
dunning cleared (at which rung) · trial nudge fired.

### M12.7 — Subscription invoicing

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-44 | **A tax-compliant invoice is generated per billing cycle, per the market's `pack.tax` declaration.** The canonical invoice is scheme-neutral: currency, subtotal, tax breakdown, total, the scheme's registration identifiers, scheme-tagged statutory extras, statuses issued / paid / failed / refunded, PDF attached. The IN instance rides `F1-28`/`F1-29`: our GSTIN and the tenant's (captured at conversion), place-of-supply logic, the SaaS service code at the scheme rate, for all tiers and overage add-ons. | `SRC` — `DOC16.gst-invoice` (docs/16 §9 — the invoice-mechanics half; the IN tax-scheme half is `F1-28`/`F1-29`, Task 6); `DOC04.invoices` (docs/04) | P0 |
| M12-45 | **The platform is the supplier of record and the invoice says so.** Our registration, our remittance, our liability; the gateway is a gateway, never merchant-of-record. Invoice generation implements `BM-40`'s posture per market. | `SRC` — `DOC01.supplier-of-record` (docs/01 — the invoice-generation half; posture `BM-40`) | P0 |
| M12-46 | **Invoices are exportable by the tenant in every billing state** — the read + export law applied to the bill itself. | `SRC` — `DOC16.invoices-exportable` (docs/16 §9) | P0 |

**Behavior detail.** Invoices list: the plan line for the cycle, proration lines from upgrades
(M12-48), overage add-ons from the ledger (M12-35), and the scheme's tax lines. E-invoicing
statutory thresholds are pack data (`F1-30`, F1's row — nothing here hardcodes a threshold).
The invoice list lives on the billing screen; each invoice's PDF is attached at issue and
never regenerated (issued documents are immutable, the suite's document posture).

**Edge cases & what-goes-wrong.**

- *Tenant has no tax registration (B2C-like SME)* → the scheme's rules decide what the invoice
  carries; capture is prompted at conversion, skippable where the scheme permits (M12-44).
- *Tax rate changes* → pack-data update; invoices already issued never change (`F8-15`'s
  pinned-document spirit; `BM-41` prices stay ex-tax).
- *Invoice PDF fetch while halted* → works (M12-46).

**Acceptance criteria.**

- Given a paid cycle, when its invoice issues, then it carries the scheme's breakdown per the
  pack, the supplier-of-record identifiers, and any ledgered overage add-ons (M12-44, M12-45).
- Given a tenant in `halted`, when they export invoices, then it works (M12-46).

**Localization notes.** Invoice documents render per the pack's formats; amounts in the
tenant's currency with market grouping. **Analytics events:** invoice issued / paid / failed.

### M12.8 — Refunds, upgrades, downgrades, cancellation

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-47 | **Refunds: 7-day money-back on the first paid cycle only.** Removes post-trial conversion risk; refund-to-source; the market scheme's credit-note artefact auto-issues against the cycle invoice (IN: GST credit note). Renewal cycles carry no refunds — cancellation runs to period end instead. | `SRC` — `DOC16.refunds` (docs/16 §10) | P0 |
| M12-48 | **Upgrade: entitlements apply immediately — a paying customer never waits.** The prorated delta for the remaining cycle bills as a one-time invoice; the plan swaps at the next cycle boundary. Cycle switches follow the same mechanics (M12-12). | `SRC` — `DOC16.upgrade` (docs/16 §10) | P0 |
| M12-49 | **Downgrade takes effect at the next cycle, with an honest preview — no mid-cycle refund.** If current usage exceeds the lower tier's ceilings, the downgrade screen shows **exactly what will be blocked before confirming**; existing over-ceiling designs remain readable and exportable forever. | `SRC` — `DOC16.downgrade` (docs/16 §10 — the mechanics; the show-before-confirm law is `F8-34`'s instance) | P0 |
| M12-50 | **Cancellation is owner-initiated from the billing screen, with a reason captured as product signal, never as a gate.** Service runs to the paid period end; data is retained; reactivation is always offered. | `SRC` — `DOC16.cancellation` (docs/16 §10) | P0 |
| M12-51 | **A trial that never converts refunds nothing because it charged nothing** — the state becomes `expired` and the soft-block matrix answers everything else. | `SRC` — `DOC16.trial-no-conversion` (docs/16 §10) | P1 |

**Behavior detail.** The downgrade preview is computed from real usage against the target
tier's book values: which designs exceed the kW ceiling (they stay readable/exportable — never
hostage), where the proposal count stands against the smaller cap, which bundles shrink. The
preview is the consent surface; confirming schedules the change at the boundary. Refund
eligibility renders plainly on the billing screen during the first-cycle window and disappears
after — never a hidden clause.

**Edge cases & what-goes-wrong.**

- *Refund requested on day 8 of the first cycle* → not eligible; the screen said the window
  plainly while it ran (M12-47, `F8-34`).
- *Upgrade mid-grace while `past_due`* → payment of the delta and the failed charge resolve
  together at the gateway; entitlements follow the successful charge (M12-09, M12-48).
- *Downgrade previewed but usage changes before the boundary* → the preview re-computes at
  confirmation time and again at the boundary; the tenant is told if the picture changed
  (M12-49's honesty).
- *Cancel, then the period ends* → `cancelled` begins behaving as `halted`; the matrix's
  always-on rows hold (M12-04, M12-22).

**Acceptance criteria.**

- Given a first paid cycle within 7 days, when the owner requests a refund, then it goes to
  source with the scheme's credit note against the cycle invoice; given any renewal cycle,
  then no refund path exists and cancellation-to-period-end is offered (M12-47).
- Given an upgrade, when it confirms, then entitlements are live immediately and a one-time
  prorated invoice exists (M12-48).
- Given a downgrade where usage exceeds the target ceilings, when the owner confirms, then
  the preview showed exactly what will block, and after the boundary the over-ceiling designs
  still read and export (M12-49).

**Localization notes.** Preview, refund and cancellation copy translated; the preview's
blocked-list uses product vocabulary. **Analytics events:** upgrade / downgrade scheduled ·
downgrade preview shown · refund issued · cancellation (reason).

### M12.9 — Trial lifecycle & conversion

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-52 | **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family). | `SRC` — `DOC16.trial` (docs/16 §2; law `BM-28`) | P0 |
| M12-53 | **Trial UX: honest countdown, soft expiry, no hostage patterns.** A countdown chip stays subtle until D-7; expiry leads to a plan-pick screen; post-expiry is the soft-block set — create/edit paths blocked with a plan prompt, read + export always working. Expiry must convert, never destroy. | `SRC` — `UXG-14` (ux-gap register, faithful notes; the D38-era mock posture superseded) | P0 |
| M12-54 | **Conversion is: pick tier and cycle → hosted checkout → mandate per the pack's rails → `active` immediately.** Payment collects at that moment and never before; the trial's remaining days do not extend the first paid period (the paid cycle starts at conversion). | `SRC` — `DOC16.trial` + `DOC16.hosted-checkout` + `DOC01.mandate-at-conversion` (mechanics halves; laws `BM-28`/`BM-29`) | P0 |

**Behavior detail.** Trial caps enforce through the same gates as plan caps (§M12.4) with the
same honesty (80% pre-warning, manual alternatives stated — e.g. manual outline when the
detection cap is reached). The trial extension is support-issued, once, and appears in the
audit log. Trial nudges are §M12.6's (M12-42).

**Edge cases & what-goes-wrong.**

- *Trial hits a cap on day 3* → soft-block UX with the upgrade path and the manual
  alternative; the trial experience is never degraded below `BM-28`'s promise (M12-52).
- *Owner converts on day 2* → `active` from that moment; no "wait for trial end" state
  (M12-54).
- *Trial expires with real data inside* → `expired` behaves as `halted`: everything readable,
  exportable, linkable; one payment reactivates (M12-07, M12-53).

**Acceptance criteria.**

- Given a new tenant, when the trial starts, then no payment instrument exists anywhere and
  every tier capability works within the caps (M12-52).
- Given trial expiry, when it lands, then the state is `expired`, the plan-pick screen is the
  path forward, and read + export + links keep working (M12-53).
- Given conversion, when checkout confirms, then the subscription exists at the gateway, the
  mandate rides the pack's rail, and entitlements are active immediately (M12-54).

**Localization notes.** Countdown and expiry copy translated, honest per `F8-34`.
**Analytics events:** trial started · nudge fired · extension granted · converted (tier,
cycle) · expired.

### M12.10 — Billing screens, reactivation surface & grandfathering mechanics

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M12-55 | **The billing screens are real, complete, and available in every state:** current plan and cycle with the book's published caps/bundles; plan selection; mandate/payment-method setup and update; invoice list with PDFs; the usage screen (§M12.5); dunning state and history; cancel; reactivate. In `halted`/`expired`/`cancelled` these screens are the guaranteed way back (`BM-32`'s fourth always-on row, enforced here). | `SRC` — `UXG-13` (ux-gap register — the real billing suite; the D26-era mock is superseded); `DOC16.softblock.always-on` (billing-screens row) | P0 |
| M12-56 | **Managing billing is EPC Owner-only; seeing state is everyone's.** Every billing act rides `F2.M12.manage-billing` (v1 matrix, restored capability). The state banner renders for all employees without amounts; the dunning banner's named audience is owner + managers (M12-40); no employee surface shows a price, invoice or usage figure — those are the Owner's screens. | `SRC` — `DOC08.matrix.manage-billing` via `F2.M12.manage-billing` (consumed); `DOC16.dunning-channels` (banner audience) | P0 |
| M12-57 | **Grandfathering mechanics:** a protected tenant bills against the plan-price rows they signed up on until their market book's protection horizon lapses; repricing never applies mid-cycle or retroactively; an upgrade moves them to the new tier under their protection terms; once the horizon lapses, repricing reaches them at the next cycle. **Forfeiture on lapse (owner ruling 2026-08-04, Q43):** a lapse — `cancelled` or `halted` — **ends the price protection**; reactivation, whether inside or after the original horizon, bills against the **current list book's rows**, never the signed-up rows. Cancellation, dunning and win-back copy states the forfeiture plainly before the lapse (M12-39/M12-41's honesty duty; `BM-42` carries the law). The row-selection arithmetic is this module's. | `SRC` — `DOC01.grandfather` via `BM-42` (consumed — the mechanics half routed here by Task 11's behavior note); forfeiture-on-lapse per owner ruling 2026-08-04 (Q43), replacing the interim no-forfeiture reading | P1 |
| M12-58 | **Billing is audit-covered:** plan changes, subscription transitions, entitlement overrides, mandate changes and every reactivation write audit entries per `F2-22`'s covered-events list. | `SRC` — `DOC08.audit-coverage` via `F2-22` (consumed) | P0 |

**Behavior detail.** The billing home answers three questions at a glance: what am I on, what
am I using (deep link to the usage screen), what needs me (dunning state, refund window,
scheduled downgrade). Reactivation from a dead state is the same screen with one primary
action. Enterprise's sales-assisted arrangements (`BM-15`) surface here only as "contact us" —
no self-serve surface invents Enterprise mechanics.

**Edge cases & what-goes-wrong.**

- *Owner deactivated mid-dunning* (the guard rails prevent losing the last Owner) → F2-19
  guarantees an Owner always exists to reach these screens.
- *A protected tenant's horizon lapses mid-cycle* → the new price applies from the next
  cycle, never mid-cycle (M12-57).
- *Billing screen opened by a non-Owner* → the state is visible, the acts are not; the screen
  says whose act it is (M12-56).

**Acceptance criteria.**

- Given a tenant in each of the six states, when the Owner opens billing, then every M12-55
  surface renders and pay/upgrade/reactivate is actionable (M12-55).
- Given any billing act, when it commits, then an audit entry exists (M12-58).
- Given a grandfathered tenant, when the book reprices, then their bill is unchanged until
  their horizon lapses and never changes mid-cycle (M12-57).
- Given a protected tenant who lapses to `cancelled` or `halted`, when they reactivate at any
  later date, then they bill against the current list book — protection forfeited on lapse —
  and the dunning/cancellation copy they saw stated the forfeiture before it happened
  (M12-57, M12-39, M12-41; owner ruling 2026-08-04 Q43).

**Localization notes.** All billing screens in every launch language; invoices per pack
formats. **Analytics events:** billing screen opened (state) · payment method updated ·
reactivation from state (which).

## 4. Cross-module contracts

**This module expects:**

| From | What it expects |
|---|---|
| `04-business-model.md` | Every number and law listed at M12-02 — tier names, book values, meters, state names, the soft-block matrix as the non-negotiable floor, cap law with the 80% pre-warning, trial law, grandfathering, supplier-of-record posture. |
| `foundations/F1-global-market-framework.md` | `pack.tax` (`F1-13`, `F1-28`–`F1-30`), the mandate rails (`F1-40`/`F1-41`), messaging compliance for dunning channels (`F1-38`), one currency per tenant (`F1-07`/`F1-27`), residency facts (`F1-43`). |
| `foundations/F2-roles-and-permissions.md` | `F2.M12.manage-billing` (Owner-only) and the audit obligations (`F2-22`). |
| `foundations/F4-data-integrity.md` | `F4-21` — nothing a field user captured is ever unrecoverable, whose photo carve-out this module's gates must honour (M12-24, M12-26); `F4-27` — a warning never disables a primary action. |
| `foundations/F8-data-honesty.md` | `F8-33` (usage screens = billed numbers, 80% pre-warning), `F8-34` (honest state copy — dunning, downgrade preview, denial messages). |
| `modules/M05` / `M06` / `M08` / `M07` / `M04` | The surface halves of the enforcement points (`M05-12`, `M06-26`, `M08-07`, `M07-37`/`M07-50`, `M04-23`) — each module guarantees no other entitlement touchpoint exists in its flow. |
| `modules/M09-field-workforce.md` | Tracked-seat toggle events (who, whom, when — `M09-04`) for tracked-seat-month metering. |
| `modules/M03-marketing.md` | Send events per channel for the marketing-sends meter (`BM-21`'s boundary). |
| `modules/M01-onboarding-and-tenant-config.md` | Signup with no billing step (`M01-11`); the tenant identity and tax-registration capture surface at conversion. |
| `modules/M11-payments-and-collections.md` | The standing separation: M11 keeps tenant collections wholly out of this module (`M11-01`/`M11-02`). |

**This module provides:**

| To | What it provides |
|---|---|
| Every module | The entitlement check and the billing-state gate as the product's only runtime gating (M12-15), with the typed denial experience (M12-21). |
| `modules/M13-dashboards-and-reporting.md` (Task 23) | Billing-state names and tier names as reporting vocabulary (via `BM-11`/`BM-33`); usage rollups (same numbers as billed, `F8-33`); the trial-to-paid conversion event (`BM-47`'s metric). |
| `foundations/F6-notifications-and-search.md` (Task 23) | The billing notification types: dunning rungs (payment failed, metered pause, final warning, halted), trial nudges and expiry, usage 80% warning, blocked voice-queue entry (owner), reactivation confirmation. Placement in the matrix is F6's. |
| `modules/M07-sales-execution.md` | Voice allowance answers at queue insert and pre-dial; the halted state that triggers inbound degradation (M12-25); the ledger the usage view reads (M12-38). |
| `foundations/F5-customer-link.md` | The standing guarantee that no billing state, surface or message ever reaches a link (M12-29). |
| `foundations/F4-data-integrity.md` | The enforcement-side guarantee that no gate touches the upload of an already-captured field photograph (M12-26). |

## 5. Non-goals

- **No pricing or packaging definition.** Every number is `04-business-model.md`'s;
  this module carries mechanics only (`DOC16.pricing-single-source`).
- **No feature flags, plan-based feature withholding, or per-tenant toggles** — entitlements
  are capacity and usage, never features (`BM-05`'s law; `DOC16.no-feature-flags`). The
  non-goal is stated positively at M12-15.
- **No tenant-collections capability.** Payment links, tranches, receipts and BYO gateway
  accounts are `modules/M11`'s; the platform never touches tenant funds (M12-01;
  `DOC16.byo-collections` is M11's).
- **No pause/resume subscription state** (M12-13).
- **No hard block, no data deletion for non-payment, no hostage pattern of any kind** — the
  suite law this module exists to enforce, not a feature it could trade away (`BM-32`).
- **No proposal-type entitlement key, ever** (Q29 ruled 2026-08-04: OPEX/PPA ungated on every
  tier); **no studio gating beyond the design-kW checkpoints, ever** (Q28 ruled 2026-08-04:
  zero feature gates in the studio) (M12-20).
- **No self-serve Enterprise mechanics** — Enterprise's bespoke arrangements are
  sales-assisted (`BM-15`); this module surfaces "contact us" only.

## 6. Open questions

Raised or carried by this document, mirrored into `registers/open-questions.md`. This module
states its side of three existing ones and raises one *(Final review)*.

| # | Question | Decision owner |
|---|---|---|
| M12-Q1 | **`Q16` — RESOLVED (owner ruling 2026-08-04).** New capture is never cut off during dunning: field capture works through the full dunning grace and pauses only at `halted`, with a mid-visit halt letting the current visit complete; reads, exports and already-captured photo uploads always-on (M12-27, M12-26). | Decision recorded 2026-08-04 (register `Q16`) |
| M12-Q2 | **`Q28` — RESOLVED (owner ruling 2026-08-04).** Zero feature gates in the studio confirmed: the design-kW ceiling at Save/Generate is the only gate, never mid-edit; over-ceiling designs readable forever; no studio entitlement key beyond it (M12-20; `M05-12`). | Decision recorded 2026-08-04 (register `Q28`) |
| M12-Q3 | **`Q29` — RESOLVED (owner ruling 2026-08-04).** The OPEX/PPA proposal type is ungated on every tier; no proposal-type entitlement key exists in this module (M12-20; `modules/M06`). | Decision recorded 2026-08-04 (register `Q29`) |
| M12-Q4 | **`Q43` — RESOLVED (owner ruling 2026-08-04).** Lapse forfeits: `cancelled`/`halted` ends the price protection and reactivation prices at the current book, inside or after the horizon; dunning/win-back copy states it plainly (M12-57, M12-39, M12-41; `BM-42`). | Decision recorded 2026-08-04 (register `Q43`) |
