# M12 · Platform billing — engineering tasks

This file covers Module M12 (Platform billing): the subscription lifecycle machine and what every state means, entitlements as the product's only runtime gating, the soft-block enforcement gates and the cap ladder, the usage ledger and the usage screen, the dunning ladder and trial nudges, subscription invoicing, refunds and plan changes, the trial's mechanics and conversion, grandfathering mechanics, and the always-available billing screens (Pricing Page, Billing Home, Plan Selection & Conversion, Usage). Task-id prefix: `T-M12-`. Source doc: `docs/prd/modules/M12-platform-billing.md` (rows M12-01…M12-58); the Pricing Page's specification rows (BM-05, BM-07) come from `docs/prd/04-business-model.md` via its brief and are dispositioned under that document's bucket. Screen tasks point at their UX briefs under `docs/ux/briefs/`, where the verbatim requirement rows live; engine, policy and integration tasks quote their rows in full below. The state banner and denial sheets several rows name are SCR-SHELL-06's surface (`docs/tasks/SHELL.md`, brief `docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md`); this file owns the behavior that feeds them.

### T-M12-001 · Pricing Page

**Type:** screen · **Tier:** P0
**PRD rows:** BM-05 (P0), BM-07 (P0) (from `docs/prd/04-business-model.md`; dispositioned under that bucket — listed here as this screen's specification rows)
**DESIGN:** SCR-M12-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M12-01-pricing-page.md`; they are the specification.
**DONE WHEN:**
- Given any tier and any module, when a tenant on that tier opens that module, then no capability is absent that a higher tier has (BM-05) — only ceilings, counts and bundle sizes differ.
- Given any cap in any tier, when the pricing page and the usage screen render, then the cap is published and visible on both, and reaching it produces §04.5's soft-block with an upgrade path — never a feature withdrawal and never a surprise (BM-07).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M12-002 · Billing Home

**Type:** screen · **Tier:** P0
**PRD rows:** M12-08 (P0), M12-46 (P0), M12-47 (P0), M12-50 (P0), M12-55 (P0)
**DESIGN:** SCR-M12-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M12-02-billing-home.md`; they are the specification. (M12-55 is a shared row: its plan-selection half lands on SCR-M12-03 / T-M12-003; the row is dispositioned here.)
**DONE WHEN:**
- Given a tenant halted for a year, when the owner pays, then a new gateway subscription exists, entitlements are live immediately, and every record is as they left it (M12-08).
- Given a tenant in `halted`, when they export invoices, then it works (M12-46).
- Given a first paid cycle within 7 days, when the owner requests a refund, then it goes to source with the scheme's credit note against the cycle invoice; given any renewal cycle, then no refund path exists and cancellation-to-period-end is offered (M12-47).
- Given a tenant in each of the six states, when the Owner opens billing, then every M12-55 surface renders and pay/upgrade/reactivate is actionable (M12-55).
- (M12-50 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — cancellation is owner-initiated, runs to the paid period end, and the reason is captured as product signal, never as a gate.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M12-003 · Plan Selection & Conversion

**Type:** screen · **Tier:** P0
**PRD rows:** M12-48 (P0), M12-49 (P0), M12-53 (P0), M12-54 (P0)
**DESIGN:** SCR-M12-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M12-03-plan-selection.md`; they are the specification. (The brief also carries the shared row M12-55 — its plan-selection half — dispositioned under T-M12-002. The trial countdown chip of M12-53 is SCR-SHELL-06's surface, `docs/tasks/SHELL.md`.)
**DONE WHEN:**
- Given an upgrade, when it confirms, then entitlements are live immediately and a one-time prorated invoice exists (M12-48).
- Given a downgrade where usage exceeds the target ceilings, when the owner confirms, then the preview showed exactly what will block, and after the boundary the over-ceiling designs still read and export (M12-49).
- Given trial expiry, when it lands, then the state is `expired`, the plan-pick screen is the path forward, and read + export + links keep working (M12-53).
- Given conversion, when checkout confirms, then the subscription exists at the gateway, the mandate rides the pack's rail, and entitlements are active immediately (M12-54).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M12-004 · Usage

**Type:** screen · **Tier:** P0
**PRD rows:** M12-34 (P0), M12-35 (P0), M12-36 (P1)
**DESIGN:** SCR-M12-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M12-04-usage-screen.md`; they are the specification. (The brief also carries M12-30's cap-ladder row, dispositioned under T-M12-009 — the ladder is gate machinery; this screen is where its 80% pre-warning must appear.)
**DONE WHEN:**
- Given any usage figure on the usage screen, when compared with what enforcement checks and the invoice bills, then all three come from the same rollup of the same ledger (M12-32, M12-34).
- Given a bundle at 80%, when the usage screen renders, then the pre-warning is present, and no §M12.4 gate for that meter has fired yet (M12-34).
- Given overage accruing, when the next invoice issues, then its add-on lines equal the ledgered overage at the book's published rates (M12-35).
- (M12-36 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — the screen is owner-scoped and informational, per-period rollups against bundles with plain overage pricing and deep links to ledger detail, "no scary meters".)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M12-005 · Subscription lifecycle machine

**Type:** engine · **Tier:** P0
**PRD rows:** M12-04, M12-05, M12-06, M12-07, M12-13, M12-14, M12-52
**Requirements (verbatim):**
- **M12-04** (P0) — **The lifecycle is one machine, six states, history append-only:** `trialing` → (pay) `active` · `trialing` → (14 days unconverted) `expired` [terminal] · `active` → (charge fails) `past_due` → (7 days unpaid) `halted` → (payment) `active` · `active` → (owner cancels) `cancelled` (runs to the paid period end, then behaves as `halted`). One non-terminal subscription per tenant. The six names are `BM-33`'s suite vocabulary and no other state name exists anywhere.
- **M12-05** (P0) — **`active` means the mandate is live and the current period paid.** Entitlement extends to the period end **plus a 3-day buffer** for webhook lag, so a tenant is never blocked by our plumbing being slow.
- **M12-06** (P0) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7.
- **M12-07** (P0) — **`expired` is terminal and behaves exactly as `halted`:** soft-block, data retained indefinitely, reactivation permanently offered. Terminal means "the trial cannot resume" — never "the tenant is done".
- **M12-13** (P1) — **Pause/resume is not offered.** No pause state exists in the machine; if the gateway ever emits such an event it is logged and alerted, never applied.
- **M12-14** (P0) — **Signup carries no billing step — billing's first appearance is the trial state itself.** Self-serve signup stays phone + OTP + company (D11's surviving half, M01's flow); no plan choice, no card, no mandate at signup (`BM-28`/`BM-29` consumed). The census's post-strike "no trial gate… anywhere" text is dead — the overlay's trial-only model governs, and the trial state, countdown and conversion surfaces (§M12.9) are exactly where billing first becomes visible.
- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).

The machine's user-visible face is the state banner (SCR-SHELL-06, `docs/tasks/SHELL.md`); this task owns the states, transitions, timers and append-only history the banner and the billing screens read.
**DONE WHEN:**
- Given any tenant at any moment, when its subscription state is read, then it is exactly one of the six `BM-33` names, its history is append-only, and at most one non-terminal subscription exists (M12-04).
- Given a paid period ending with a slow webhook, when the period end passes, then entitlement persists through the 3-day buffer and no user sees a block (M12-05).
- Given a charge failure, when days 0–3 elapse, then everything works with a banner; when day 4 arrives, then exactly the metered features pause; when day 7 passes unpaid, then the state is `halted` with the matrix's always-on rows intact (M12-06).
- Given signup, when the flow completes, then no billing step occurred and the tenant is `trialing` with the trial's caps (M12-14).
- Given a new tenant, when the trial starts, then no payment instrument exists anywhere and every tier capability works within the caps (M12-52).
- (M12-07 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — `expired` is terminal and behaves exactly as `halted`: soft-block, data retained indefinitely, reactivation permanently offered. Its soft-block half is exercised by T-M12-009's M12-22 line, which names `expired` in the always-on set, and its path forward by T-M12-003's M12-53 line.)
- (M12-13 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — no pause state exists in the machine, and a gateway pause/resume event is logged and alerted, never applied. The state-name half is exercised by M12-04's line above, which admits exactly the six `BM-33` names.)

### T-M12-006 · Charge truth, reconciliation & billing timers

**Type:** engine · **Tier:** P0
**PRD rows:** M12-09, M12-43
**Requirements (verbatim):**
- **M12-09** (P0) — **A successful charge is the source of truth for entitlement.** It extends the entitled window, writes the payment, triggers the tax invoice and clears dunning — atomically from the tenant's point of view. Stale or out-of-order gateway events can never regress state; a reconcile-by-poll backstop (every 6 h) repairs drift, and every repair raises an internal alert — reconciliation is supposed to be boring.
- **M12-43** (P1) — **The billing timers are fixed product timers:** the trial-expiry sweep flips entitlements to the soft-block set (read + export always work); reconciliation runs its 6-hour cadence. Carried as product timers, not calendar language.
**DONE WHEN:**
- Given a successful charge, when it lands, then window + payment + invoice + dunning-clear all follow from that one event, and no out-of-order event can undo it (M12-09).
- (M12-43 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — the trial-expiry sweep and the 6-hour reconciliation cadence are fixed product timers, carried as product timers and not as calendar language. The sweep's outcome is exercised by T-M12-003's M12-53 line and the cadence's repair duty by M12-09's line above.)

### T-M12-007 · Provider-neutral billing ports: hosted checkout, mandate rails & plan objects

**Type:** integration · **Tier:** P0
**PRD rows:** M12-03, M12-10, M12-11, M12-12
**Requirements (verbatim):**
- **M12-03** (P0) — **Billing is provider-neutral; the launch market's gateway is a reference implementation.** Subscription billing, mandates, hosted checkout and webhooks are capabilities behind provider-neutral billing ports; the billing schema is per-currency and provider-neutral, one currency per tenant (`F1-07`/`F1-27` consumed). The v1 reference implementation is Razorpay (`R4`, the IN rail) — named here once, as reference implementation only; another market adds adapters, never product change.
- **M12-10** (P0) — **Checkout is the gateway's hosted flow; the platform never sees a payment instrument.** Card, mandate and bank details exist only at the gateway (the market's localisation obligations stay the gateway's problem — IN instance per `F1-43`). The product's own screens collect nothing sensitive.
- **M12-11** (P0) — **The mandate is established at conversion, never at signup, on the market pack's rails.** Which rail collects which cycle is pack data (`F1-40`/`F1-41` for IN: mandate ladder for monthly self-serve; e-NACH/invoice for Enterprise; every yearly total exceeds the mandate cap and is collected as a single payment link/invoice per year, renewal a fresh invoice). Pre-debit notifications before each charge are the gateway's duty; dunning copy may reference them and builds nothing.
- **M12-12** (P1) — **Every tier exists as two gateway plan objects (monthly + yearly), mirrored 1:1 by per-currency plan-price rows.** Our tables are the source of truth for entitlements; the gateway's for money. A cycle switch (monthly → yearly) follows exactly the tier-upgrade mechanics: immediate entitlements, prorated delta, new subscription at the boundary (M12-48).
**DONE WHEN:**
- Given the module body, when searched for vendor names, then the only occurrence is M12-03's reference-implementation naming (M12-03).
- Given conversion, when checkout confirms, then the subscription exists at the gateway, the mandate rides the pack's rail, and entitlements are active immediately (M12-54 — dispositioned to T-M12-003; carried here as well because these ports are what it exercises end-to-end, and it is the only PRD acceptance line that touches hosted checkout and the mandate rail).
- (M12-10, M12-11 and M12-12 carry no dedicated Given/When/Then lines in the PRD's acceptance blocks; the requirement texts above are the binding criteria — checkout is the gateway's hosted flow and the platform never sees a payment instrument (M12-10); the mandate is established at conversion, never at signup, on the market pack's rails, with pre-debit notification the gateway's duty (M12-11); every tier exists as two gateway plan objects, monthly and yearly, mirrored 1:1 by per-currency plan-price rows, with our tables the source of truth for entitlements and the gateway's for money, and a cycle switch following M12-48's tier-upgrade mechanics exactly (M12-12). M12-14's line under T-M12-005 exercises M12-11's "never at signup" half; M12-48's line under T-M12-003 exercises M12-12's cycle-switch half.)

### T-M12-008 · Entitlement engine

**Type:** engine · **Tier:** P0
**PRD rows:** M12-16, M12-17, M12-18, M12-19, M12-27
**Requirements (verbatim):**
- **M12-16** (P0) — **Entitlements are the current effective limits per key, recomputed on every charge and plan change**, sourced from plan, trial, or a manual grant — and queried on the hot path by every gate. No mechanism in the entitlement model can hold data hostage: read + export work regardless of any entitlement value.
- **M12-17** (P0) — **Plans carry trial days and the included bundles** (voice minutes, AI detections, OTP fair-use — not billed v1, storage, plus the V2 meters); capacity ceilings (single-design kW, proposal counts, Starter's active projects) live in the plan definition. Seats are reserved and always unlimited — no per-seat pricing exists (the sole seat-counting exception is the tracked-seat add-on, `BM-22`, metered in §M12.5).
- **M12-18** (P0) — **Entitlement checks run before the action; metering never blocks the action.** Billable usage (voice, detections) checks entitlements first; the metering write itself never fails or delays the request it records. Non-billable metrics are still metered for quotas and cost visibility.
- **M12-19** (P1) — **Support-issued goodwill credits are entitlement-override records — audited, never manual edits.** Every override names who, what, why and when, and appears in the audit log (`F2-22`'s "entitlement overrides").
- **M12-27** (P0) — **New field capture is never cut off before `halted` (owner ruling 2026-08-04, Q16).** No enforcement mechanic cuts off new field capture during dunning — capture works through the **full dunning grace** (the `past_due` window, M12-39) and **pauses only at `halted`**; a **halt that lands mid-visit lets the current visit complete** ("never strand a surveyor on a roof"); reads, exports and the upload of already-captured photographs are unchanged, always-on (M12-24, M12-26).
**DONE WHEN:**
- Given a plan change or charge, when it commits, then effective entitlements recompute in the same act and every subsequent check uses them (M12-16).
- Given a metered action within allowance, when the meter write fails internally, then the action still succeeds and the miss is repaired by reconciliation — never a user-facing failure (M12-18).
- Given a photograph already captured in the field on a tenant in any billing state, when it uploads, then no gate delays or refuses it; and given new field capture during dunning, then it continues — pausing only at `halted`, with a visit under way allowed to complete (M12-26, M12-27; owner ruling 2026-08-04 Q16).
- (M12-17 and M12-19 carry no dedicated Given/When/Then lines in the PRD's acceptance blocks; the requirement texts above are the binding criteria — plans carry trial days, the included bundles and the capacity ceilings, seats are reserved and always unlimited with no per-seat pricing beyond the tracked-seat add-on (M12-17); support-issued goodwill credits are entitlement-override records — audited, never manual edits — each naming who, what, why and when and appearing in the audit log (M12-19). M12-19's audit half is exercised by M12-58's line under the Laws section, whose `F2-22` covered-events list names entitlement overrides.)

### T-M12-009 · Soft-block enforcement gates & cap ladder

**Type:** engine · **Tier:** P0
**PRD rows:** M12-21, M12-22, M12-23, M12-30, M12-31
**Requirements (verbatim):**
- **M12-21** (P0) — **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law.
- **M12-22** (P0) — **The always-on set is enforced as unconditional:** in every state including `halted`, `expired` and post-period `cancelled` — read everything, search, dashboards; export (CSV, data export, existing proposal PDFs, invoices); customer links (view **and** respond) and progress pages; billing screens with pay/upgrade/reactivate. The gated set pauses only at `halted`/`expired`/`cancelled`(post-period): create/edit of leads, tasks, activities, surveys; studio create/edit (read-only open always works); generate/send proposals, mark won/lost, project updates; file/photo uploads. Metered features pause from `past_due` day 4; team invites (OTP spend) block from day 4.
- **M12-23** (P0) — **The enforcement-point table is closed — where each gate fires, and what denial looks like:** see the table below. No gate exists at any other point; in particular nothing fires mid-edit, per-keystroke, or on read.
- **M12-30** (P0) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting.
- **M12-31** (P0) — **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited".

The closed table M12-23 names, copied verbatim from `docs/prd/modules/M12-platform-billing.md` §M12.4:

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

The typed denial and banner render on SCR-SHELL-06 (`docs/tasks/SHELL.md`, brief `docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md`); this task owns the gates, the cap ladder's timers and the specific pause-message content they emit.
**DONE WHEN:**
- Given any state in the matrix and any capability row, when M12's enforcement is audited row by row, then no ✓ has become a block and no block has widened (M12-21, M12-22).
- Given each gate in the enforcement-point table, when its fire point and denial are tested, then they match the table exactly and no other enforcement point exists (M12-23).
- Given a cap reaching 80%, when the usage screen renders, then the pre-warning is present before any gate has fired (M12-30, M12-34).
- (M12-31 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — every pause message states exactly what paused and what still works, specifically, never a generic "account limited". Its message content is exercised by M12-39's line under T-M12-011, "day 4's message names the paused set exactly", and by SCR-SHELL-06's rendering half in `docs/tasks/SHELL.md`.)

### T-M12-010 · Usage metering ledger & rollups

**Type:** engine · **Tier:** P0
**PRD rows:** M12-32, M12-33, M12-37
**Requirements (verbatim):**
- **M12-32** (P0) — **The ledger is the bill.** Usage metering is an append-only ledger and no other counter exists: every event carries provenance (the call, the detection, the send, the document) and an idempotency key, so a retried job or duplicate webhook can never double-meter; rollups are always reproducible from the ledger — the same discipline as the money path. Internal cost estimates are never customer-facing.
- **M12-33** (P0) — **Metering rules, per meter:** voice minutes — one event per completed call, every call ledgered; AI detections — bill only when a result was returned, failures never bill; OTP — tracked for cost visibility, fair-use capped, **not billed in v1**; storage — a nightly gauge snapshot, never a counter; **tracked seats (V2)** — tracked-seat-months from the owner's toggle events (`M09-04`), with month-fraction arithmetic owned here; **marketing sends (V2)** — per-channel send events against the book's bundles (`BM-21`, `M03`'s surfaces).
- **M12-37** (P1) — **Proxied third-party services are metered per tenant with quotas — as platform cost lines, not tenant bills.** The imagery/energy/AI services the product proxies are server-proxied with per-tenant metering and quotas so a runaway tenant cannot torch margin; none of these appear on the tenant's bill (the billed meters are M12-33's closed set).
**DONE WHEN:**
- Given any usage figure on the usage screen, when compared with what enforcement checks and the invoice bills, then all three come from the same rollup of the same ledger (M12-32, M12-34 — M12-34 is dispositioned to T-M12-004; the PRD's own line cites both rows, and this is the ledger half of it).
- (M12-33 and M12-37 carry no dedicated Given/When/Then lines in the PRD's acceptance blocks; the requirement texts above are the binding criteria — the per-meter rules are M12-33's closed set (one event per completed call for voice; AI detections bill only when a result was returned and failures never bill; OTP tracked for cost visibility, fair-use capped, not billed in v1; storage a nightly gauge snapshot, never a counter; tracked seats and marketing sends V2), and proxied third-party services are metered per tenant with quotas as platform cost lines that never appear on the tenant's bill (M12-37). M12-32's line above exercises the reproducibility and idempotency discipline both rules ride on.)

### T-M12-011 · Dunning ladder & trial nudges

**Type:** engine · **Tier:** P0
**PRD rows:** M12-39, M12-40, M12-41, M12-42
**Requirements (verbatim):**
- **M12-39** (P0) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04, Q43):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it.
- **M12-40** (P0) — **Dunning channels are the market pack's stack, and platform→tenant messaging is ours to send.** The IN stack: in-app banner (owner + managers), push, SMS on registered templates (`F1-38`), and a business-messaging utility template where the owner opted in. D32 constrains tenant→customer messaging only — it does not restrict the platform messaging its own tenants. A future market's pack names its own channel stack.
- **M12-41** (P0) — **All dunning copy is honest about state — no data-deletion threats, ever, because nothing is deleted.** Copy names the state, the consequence that will actually occur, and the resolving action; pre-debit notifications are the gateway's and may be referenced, not imitated. Consequences that **will** occur include the grandfathering forfeiture where the tenant is protected (owner ruling 2026-08-04, Q43): dunning and win-back copy names the price-protection loss honestly, and win-back offers never imply the old price survives the lapse.
- **M12-42** (P1) — **Trial nudges reuse the dunning pipeline:** day 7 ("half way"), day 12, day 14 (expiry) — same channels, same honesty.
**DONE WHEN:**
- Given a first failed charge, when the ladder runs unpaid to day 7, then each rung fires with its stated content, day 4's message names the paused set exactly, and day 7's confirms what still works (M12-39, M12-41).
- Given all dunning copy in all languages, when audited, then no message threatens deletion or any consequence that will not occur (M12-41).
- (M12-40 and M12-42 carry no dedicated Given/When/Then lines in the PRD's acceptance blocks; the requirement texts above are the binding criteria — the dunning channel stack is the market pack's, platform→tenant messaging is ours to send and D32 constrains tenant→customer messaging only (M12-40); trial nudges reuse the dunning pipeline at day 7, day 12 and day 14, same channels, same honesty (M12-42). M12-41's audit line above covers the honesty half of both.)

### T-M12-012 · Subscription invoicing

**Type:** engine · **Tier:** P0
**PRD rows:** M12-44, M12-45
**Requirements (verbatim):**
- **M12-44** (P0) — **A tax-compliant invoice is generated per billing cycle, per the market's `pack.tax` declaration.** The canonical invoice is scheme-neutral: currency, subtotal, tax breakdown, total, the scheme's registration identifiers, scheme-tagged statutory extras, statuses issued / paid / failed / refunded, PDF attached. The IN instance rides `F1-28`/`F1-29`: our GSTIN and the tenant's (captured at conversion), place-of-supply logic, the SaaS service code at the scheme rate, for all tiers and overage add-ons.
- **M12-45** (P0) — **The platform is the supplier of record and the invoice says so.** Our registration, our remittance, our liability; the gateway is a gateway, never merchant-of-record. Invoice generation implements `BM-40`'s posture per market.
**DONE WHEN:**
- Given a paid cycle, when its invoice issues, then it carries the scheme's breakdown per the pack, the supplier-of-record identifiers, and any ledgered overage add-ons (M12-44, M12-45).
- Given overage accruing, when the next invoice issues, then its add-on lines equal the ledgered overage at the book's published rates (M12-35 — dispositioned to T-M12-004; carried here as well because the add-on lines are this task's invoice output, and T-M12-004 owns the same line's usage-screen half).

### T-M12-013 · Grandfathered price-row selection

**Type:** engine · **Tier:** P1
**PRD rows:** M12-57
**Requirements (verbatim):**
- **M12-57** (P1) — **Grandfathering mechanics:** a protected tenant bills against the plan-price rows they signed up on until their market book's protection horizon lapses; repricing never applies mid-cycle or retroactively; an upgrade moves them to the new tier under their protection terms; once the horizon lapses, repricing reaches them at the next cycle. **Forfeiture on lapse (owner ruling 2026-08-04, Q43):** a lapse — `cancelled` or `halted` — **ends the price protection**; reactivation, whether inside or after the original horizon, bills against the **current list book's rows**, never the signed-up rows. Cancellation, dunning and win-back copy states the forfeiture plainly before the lapse (M12-39/M12-41's honesty duty; `BM-42` carries the law). The row-selection arithmetic is this module's.
**DONE WHEN:**
- Given a grandfathered tenant, when the book reprices, then their bill is unchanged until their horizon lapses and never changes mid-cycle (M12-57).
- Given a protected tenant who lapses to `cancelled` or `halted`, when they reactivate at any later date, then they bill against the current list book — protection forfeited on lapse — and the dunning/cancellation copy they saw stated the forfeiture before it happened (M12-57, M12-39, M12-41; owner ruling 2026-08-04 Q43).

## Laws (enforced through screens and review, no standalone build)

- **M12-01** (P0) — **Two money systems that never mix — this module is the platform side.** (1) Platform SaaS billing: the tenant pays us, on our merchant account, under this module. (2) Tenant customer-collections: the customer pays the EPC via the tenant's own gateway account, under `modules/M11`. The platform never touches tenant funds; no surface here shows a collections figure, no total mixes the two, and the vocabularies stay disjoint — *subscription, plan, invoice* here; *collections, tranches, receipts* there (`M11-02`'s reciprocal). — *Enforced by:* content review of every M12 surface (T-M12-001…T-M12-004 and SCR-SHELL-06) and M11's reciprocal law; its acceptance line: Given every surface in this module, when audited for content, then no collections figure, tranche or customer-payment fact appears, and vice versa for M11 (M12-01).
- **M12-02** (P0) — **Every number this module enforces is `04-business-model.md`'s.** Tier names (`BM-11`), prices/caps/bundles (`BM-41` for the launch book), the meter list (`BM-16`–`BM-22`), the billing-state vocabulary (`BM-33`), the soft-block law and matrix (`BM-32`–`BM-36`), cap law with the 80% pre-warning (`BM-34`), trial law (`BM-28`–`BM-31`), grandfathering (`BM-42`) and the supplier-of-record posture (`BM-40`) are defined there once. This module adds transitions, timers, gates, screens and records — never a second definition of any fact. — *Enforced by:* every task in this file sourcing values from book data via entitlements (T-M12-008) and review; its acceptance line: Given any price, cap or bundle rendered here, when traced, then it resolves to the market book via entitlements and to no constant of this module's own (M12-02).
- **M12-15** (P0) — **There are no feature flags in this product; the single runtime gate is billing entitlements.** Features ship enabled when merged. A user's feature availability is determined only by plan entitlements (ceilings and booleans) plus usage allowances (metered bundles) — no per-tenant toggles, no beta flags, no dark launches, anywhere. — *Enforced by:* T-M12-008 and T-M12-009 being the product's only gating, and review (a feature flag anywhere is a defect); its acceptance line: Given the whole product, when searched for runtime gating, then every gate resolves to a billing entitlement or billing state and nothing else (M12-15).
- **M12-20** (P0) — **Ceilings gate at product boundaries, never inside engines — CONFIRMED FINAL (owner rulings 2026-08-04, Q28/Q29).** No kW clamp exists inside the design engine: the single-design ceiling is a billing entitlement enforced at M12-21's checkpoints only (`DOC05.no-kw-clamp`). The owner confirmed both formerly open restraints as law: **Q28** — **zero feature gates in the studio**; the design-kW ceiling is the only gate, enforced at Save/Generate (never mid-edit), over-ceiling designs readable forever, and no studio entitlement key beyond it exists; **Q29** — the **OPEX/PPA proposal type is ungated on every tier** (the never-gate-features law holds; the kW ceiling applies naturally) and **no proposal-type entitlement key exists**, ever, in this module. — *Enforced by:* T-M12-009 implementing only the closed enforcement-point table, and review of the entitlement key set; its acceptance line: Given the entitlement key set, when audited, then no key gates a studio capability beyond design-kW and none references a proposal type (M12-20 — confirmed final, owner rulings 2026-08-04 Q28/Q29).
- **M12-24** (P0) — **The never-gated list is law:** reads · search · exports · customer links · billing screens · **engineer sign-off on already-submitted designs** (a safety workflow) · the upload of photographs already captured in the field. No enforcement design may touch any of them, in any state, for any cap. — *Enforced by:* T-M12-009's gates carrying these as hard exclusions, and review of every enforcement design; its acceptance line: Given every item on the never-gated list in every billing state, when exercised, then it works (M12-24).
- **M12-25** (P0) — **When halted, inbound agent calls degrade to a missed-call log + voicemail** — no AI minutes burn, the caller is never told about billing, and the degradation surface is `modules/M07`'s (`M07-50`); this module owns the state that triggers it. — *Enforced by:* the `halted` state T-M12-005 produces, consumed by M07's degradation ladder (`docs/tasks/M07-sales-execution.md` T-M07-028).
- **M12-26** (P0) — **A photograph already captured in the field always uploads, in every billing state.** The block is on new mutations from the interface, never on the upload of a photograph the field user has already taken — the one piece of work the product holds on the device (`F4-21`). No gate may inspect, delay or refuse that upload, and reads work while blocked. — *Enforced by:* T-M12-009's gates never touching the upload path, verified by T-M12-008's DONE WHEN upload line: Given a photograph already captured in the field on a tenant in any billing state, when it uploads, then no gate delays or refuses it; and given new field capture during dunning, then it continues — pausing only at `halted`, with a visit under way allowed to complete (M12-26, M12-27; owner ruling 2026-08-04 Q16).
- **M12-28** (P0) — **Read + export always work — the pre-committed law, enforced here.** "Never hold a customer's data hostage": tenant-level read and export work in every billing state, and trial expiry pauses only new creation. This is the one clause of the dead deferred-era billing section that survives, kept verbatim, and it outranks every enforcement idea. — *Enforced by:* T-M12-009's unconditional always-on set (M12-22) and review — it outranks every enforcement idea in this file.
- **M12-29** (P0) — **No billing surface, state, or dunning behaviour ever reaches a customer link.** Links stay live — view and respond — in every state; the EPC's customer never learns the EPC's billing state from us. `foundations/F5` states the standing constraint (`F5-23`, `F5-60`); this module is bound by it at every gate. — *Enforced by:* T-M12-009's gates and T-M12-011's channels never addressing a customer link, and review against F5's standing law.
- **M12-38** (P0) — **The agent usage view reads this ledger — the same numbers as billed.** `modules/M07`'s usage view (`M07-59`) and any dashboard usage figure (`modules/M13`) read M12's rollups; whether a cap applies is entitlement data from here; the deferred-era "no plan cap by design" claim is dead and appears nowhere. — *Enforced by:* T-M12-010's rollups being the single source consumed by the agent usage screen (`docs/tasks/M07-sales-execution.md` T-M07-020) and M13's dashboards; review that no consumer keeps a second counter.
- **M12-51** (P1) — **A trial that never converts refunds nothing because it charged nothing** — the state becomes `expired` and the soft-block matrix answers everything else. — *Enforced by:* T-M12-005's `trialing` → `expired` transition and T-M12-002's refund surface existing only in the first paid cycle; review that no refund path exists for an unconverted trial.
- **M12-56** (P0) — **Managing billing is EPC Owner-only; seeing state is everyone's.** Every billing act rides `F2.M12.manage-billing` (v1 matrix, restored capability). The state banner renders for all employees without amounts; the dunning banner's named audience is owner + managers (M12-40); no employee surface shows a price, invoice or usage figure — those are the Owner's screens. — *Enforced by:* `F2.M12.manage-billing` guarding every billing act in T-M12-002, T-M12-003 and T-M12-004 (owner-scoped screens, non-owner state-only rendering per their briefs), the banner audiences in T-M12-011, and review.
- **M12-58** (P0) — **Billing is audit-covered:** plan changes, subscription transitions, entitlement overrides, mandate changes and every reactivation write audit entries per `F2-22`'s covered-events list. — *Enforced by:* every mutation-bearing task in this file (T-M12-002, T-M12-003, T-M12-005, T-M12-007, T-M12-008, T-M12-013) writing audit entries per `F2-22`, and review against its covered-events list; its acceptance line: Given any billing act, when it commits, then an audit entry exists (M12-58).

## Disposition index

| Row | Disposition |
|---|---|
| M12-01 | LAW |
| M12-02 | LAW |
| M12-03 | T-M12-007 |
| M12-04 | T-M12-005 |
| M12-05 | T-M12-005 |
| M12-06 | T-M12-005 |
| M12-07 | T-M12-005 |
| M12-08 | T-M12-002 |
| M12-09 | T-M12-006 |
| M12-10 | T-M12-007 |
| M12-11 | T-M12-007 |
| M12-12 | T-M12-007 |
| M12-13 | T-M12-005 |
| M12-14 | T-M12-005 |
| M12-15 | LAW |
| M12-16 | T-M12-008 |
| M12-17 | T-M12-008 |
| M12-18 | T-M12-008 |
| M12-19 | T-M12-008 |
| M12-20 | LAW |
| M12-21 | T-M12-009 |
| M12-22 | T-M12-009 |
| M12-23 | T-M12-009 |
| M12-24 | LAW |
| M12-25 | LAW |
| M12-26 | LAW |
| M12-27 | T-M12-008 |
| M12-28 | LAW |
| M12-29 | LAW |
| M12-30 | T-M12-009 |
| M12-31 | T-M12-009 |
| M12-32 | T-M12-010 |
| M12-33 | T-M12-010 |
| M12-34 | T-M12-004 |
| M12-35 | T-M12-004 |
| M12-36 | T-M12-004 |
| M12-37 | T-M12-010 |
| M12-38 | LAW |
| M12-39 | T-M12-011 |
| M12-40 | T-M12-011 |
| M12-41 | T-M12-011 |
| M12-42 | T-M12-011 |
| M12-43 | T-M12-006 |
| M12-44 | T-M12-012 |
| M12-45 | T-M12-012 |
| M12-46 | T-M12-002 |
| M12-47 | T-M12-002 |
| M12-48 | T-M12-003 |
| M12-49 | T-M12-003 |
| M12-50 | T-M12-002 |
| M12-51 | LAW |
| M12-52 | T-M12-005 |
| M12-53 | T-M12-003 |
| M12-54 | T-M12-003 |
| M12-55 | T-M12-002 |
| M12-56 | LAW |
| M12-57 | T-M12-013 |
| M12-58 | LAW |
