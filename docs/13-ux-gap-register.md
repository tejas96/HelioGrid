# 13 — UX Gap Register

**Status:** Binding · 2026-07-24 · Owner: product/design
**Sources:** ./research/uxAL.md, ./research/uxMZ.md (mockup catalogue + "Notable gaps"), ./research/journey.md (journey map), ./research/phases710.md (studio tool census). Rulings referenced: docs/15-spec-resolutions.md.

The **80** mockups vendored at `design/mockups/` (original source: the owner's HelioGrid UX folder, vendored 2026-07-24) are production specs for most of the product. (Count verified against disk 2026-07-30: exactly 80 `*.dc.html`, inclusive of the 7 `Layout*` sub-sheets and `Project Flow`. Earlier "85" references were wrong under any counting.) This register lists every screen or flow the mockups do **not** cover. Each gap is **designed at implementation time** — by the implementing agent/designer, directly in the design system (`packages/tokens`, N1–N10, touch contract), inside the module's build slice. No new Claude-Design phase. A gap is closed when the screen ships wired into its flow (never orphaned), with loading/empty/error/offline states, both breakpoints, and the light theme correct (light-only per docs/15 R19-A).

> **20-day directive (2026-07-24):** every phase label in the tables below now lands INSIDE
> the single 20-day build (docs/14 tracks): "Launch-1 …" rows → Tracks A/B/C, "Launch-2 …"
> rows → Tracks C/M, "studio port" rows → Track D, offline rows → Track E. UXG-11 (named
> links + OTP-at-accept) and UXG-05 (customer merge) are IN-SCOPE — no v1.1 exists. Only
> spec-locked exclusions (D29 crew login, D32 WhatsApp sending) stay out, by product law
> not by timeline.

**Register rules**
1. Before building a module, check this table; claim the gaps your slice touches.
2. Closing a gap = ship it + mark the row `CLOSED (PR/date)`. Do not delete rows.
3. New gaps discovered during build are appended with the same format — this file is the single ledger.
4. "Blocks" names the roadmap item (docs/14) that cannot reach done while the gap is open.

## A · CRM & pipeline (Stages 2–3)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-01 | **CSV import wizard** — upload → column mapping → preview with duplicate count → import report | 2 | D13 names CSV as a v1 lead source; no mockup exists (./research/uxAL.md "Notable gaps"). Bad imports poison the phone-as-identity dedupe model | Desktop-first (owner at a desk). Map columns to lead fields with auto-guess; preview shows "N rows · M duplicates by phone"; duplicates skippable or logged as enquiries on existing leads; import runs as a BullMQ job with progress + failure report | Launch-1 CRM core |
| UXG-02 | **Duplicate-found dedupe sheet** — existing owner + last contact + three choices | 2 | QuickAddLead mockup shows the trigger, not the full sheet. Wrong choice here creates the double-chase problem the spec exists to kill | Sheet on capture from every channel: shows existing lead (owner, stage, last contact) → Open existing / Log enquiry on existing / Create anyway (reason mandatory, audited). Same sheet reused by import preview and inbound-call capture | Launch-1 CRM core |
| UXG-03 | **Capture settings** — lead-source toggles, website form snippet, WhatsApp number display | 2 / Settings | Named in journey Stage 2; no `.dc.html`. Owners must see which channels are live vs "later" (D13) | Settings sub-screen: toggles for manual / CSV / inbound-agent; website form + inbound WhatsApp rendered as "later" cards, not teasers. Copy-paste form snippet when that channel lands | Launch-2 (inbound agent GA) |
| UXG-04 | **Assign screen with rep open-load** (D14) | 3 | Assignment is manual **with load visible** — the load view is the whole feature; no mockup | From Lead inbox and Lead detail: rep list with open-lead count + overdue count at assign time; single tap assigns; no rules engine. Bulk-assign from inbox multi-select | Launch-1 CRM core |
| UXG-05 | **Merge-customer flow** (husband/wife, two numbers) | 2–3 | Dedupe by phone cannot catch it; journey says "offer merge later" but the flow is undesigned (./research/journey.md §6.8) | **IN the 20-day build per R8-amended; designed in the Track A CRM slice.** Data model ready now (customers/contacts split). Design: pick survivor, re-point leads/proposals/links, keep audit trail, irreversible-with-confirm | Track A CRM core (in-scope) |

## B · Design stage & engineering (Stage 5)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-06 | **Engineer sign-off queue** | 5 | Structural adequacy is human-decided (hard product law); the queue is the engineer's home screen and has **no mockup** (./research/uxMZ.md "Notable gaps") | List oldest-first: customer, kWp, designer, waiting-time. Open → review surface (UXG-07). Role-gated to Engineer; feeds the "designs awaiting" home redirect | Launch-1 studio port (10.11 acceptance) |
| UXG-07 | **Return-with-comments review** | 5 | Approve/return is the only path a design takes to a customer; comments must pin to the fault, not float | Review = read-only studio + drawings; Approve records who+when (structural verification state); Return requires ≥1 comment pinned to an object/step; designer gets notification + pinned markers in the studio | Launch-1 studio port |
| UXG-08 | **Design variants side-by-side** | 5 | D16: customer sees one recommendation, designer compares variants; DesignStudio mockup shows the variants row only | Compare 2–4 variants: kWp, annual generation, price, payback, health score; set `is_recommended` here; duplicate-as-variant entry point. Mobile: horizontal snap cards | Launch-1 studio port |
| UXG-09 | **Proposal Quick mode** (steps 1/3/8/10) | 6B | Ruled **committed** (docs/15 R11); mockups render only the full 11-step rail | Entry toggle on ProposalEntry: Quick shows 4 steps; AI-fills 4/5; tenant defaults fill 6/7/9/11; "expand to full builder" is loss-free. Validation still only at Generate (R12) | Launch-1 proposal builder |

## C · Offline & sync (Stage 4 + global mobile)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-10 | **Offline/sync status system** — global indicator, sync centre, per-record badges, conflict notices | 4 / shell | Spec promises "3 surveys waiting · 47 photos · will upload on Wi-Fi" but **no screen depicts offline states** (./research/uxMZ.md) | Non-blocking banner + sync centre sheet: queued writes, photo upload progress (PowerSync attachments), per-survey "waiting/uploading/synced/failed-retry" chips; survey-version notice on revisit ("v2 — v1 kept"); stale-read banner when serving cache. Exact offline boundary per docs/06 and ruling R14 | Launch-2 field app; physical-survey offline |

## D · Customer link & C&I (Stage 6 / C-journey)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-11 | **Named links + OTP-at-accept** (D33 mitigation) | 6 / C8 | Single link accepted for launch (R6), but a ₹92L C&I acceptance by "whoever holds the URL" is the sharpest liability in the product; docs/08 requires the token scheme to support it from day one | SHIPS IN the 20-day build (R6 amended): per-contact named links (label + scope on the customer_links entity), per-link open attribution, and MSG91 OTP challenge on Accept above a tenant-set value threshold. UI: link manager on the deal + OTP sheet on the customer page | Track B customer link (in-scope) |
| UXG-12 | **Customer mid-journey states** — question inbox (tenant side), C9 advance-payment via tenant Razorpay link | C3–C9 | CustomerProposal covers states A–F; the tenant-side handling of "Ask a question" and the BYO-Razorpay payment-link handoff have no mockups | Questions land as notifications + timeline entries with reply-by-call workflow (app never sends). C9: "Copy payment link" action on the due tranche once tenant connects Razorpay (`PaymentLinkPort`); receipt state reflects webhook confirmation | Launch-1 customer link; tenant collections |

## E · Billing, usage & trial (v1 — supersedes the D26-era mock)

`Billing.dc.html` is a **D26-era shape mock** with sample pricing. Billing is now real in v1 (owner override 2026-07-24, docs/16) — the whole cluster is redesigned at implementation time against Razorpay Subscriptions.

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-13 | **Billing suite (real)** — plan selection, UPI AutoPay/e-mandate setup, current plan, invoices, dunning | Settings 8.7 | Platform revenue path; the mock has no mandate flow, no trial states, no failure handling | Per docs/16: plan cards (Starter/Growth/Pro/Enterprise), Razorpay Checkout handoff for mandate creation, pre-debit notice explainer, `subscription.charged`/failed states, GST invoice list (Razorpay Invoices), payment-method manage. "Your data is always yours" export block survives from the mock | Launch-1 billing GA |
| UXG-14 | **Trial lifecycle + soft-block states** | Global | Trial-only, no free tier: expiry must convert, never destroy | Trial countdown chip (subtle until D-7), expiry screen → plan pick; post-expiry soft-block: create/edit paths blocked with plan prompt, **read + export always work** (pre-commitment, docs/16). No hostage patterns | Launch-1 billing GA |
| UXG-15 | **Usage screen** — metered voice minutes, AI detections, OTP/SMS, storage vs bundle | Settings | Usage ledger exists from day one (docs/16); AgentPerformance shows minutes only in an agent context | Per-period rollups vs bundle with plain overage pricing; deep-links to the ledger detail; no scary meters — informational, tenant-scoped, owner-only | Launch-1 billing GA |

## F · Voice & telephony (new — user directive 2026-07-24)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-16 | **Number provisioning** — platform Exophone assign or BYO number host/port with KYC | Settings / voice | Per-tenant numbers are a directive; TRAI CLI rules make BYO a hosting/porting flow with document upload — no mockup exists anywhere | Wizard: choose platform number (instant, default) vs bring-your-own → KYC doc upload → status tracking (`tenant_phone_numbers`: requested/verifying/active/failed) with honest lead-time copy. 1600/140x series explained in one line | Launch-2 voice GA |
| UXG-17 | **IVR flow builder (inbound)** — greeting → menu → route to AI agent / human ring-group / voicemail | Settings / voice | Directive: IVR both directions. Inbound routing is tenant-visible config, not code | Keep it a **list-based step editor**, not a canvas: ordered menu items (key → destination), business-hours switch reusing the calling-window control, per-language greeting text/TTS preview. Versioned like agent config (D36) | Launch-2 voice GA |
| UXG-18 | **Outbound DTMF traversal surfacing** | 7 | The agent can navigate IVRs (`sendDtmf`/`onDtmf`); reps must see what happened on such calls | Call-result timeline entry gains "navigated an IVR (N steps)" line + transcript markers; failure state "stuck in IVR — escalated". No config UI needed v1 | Launch-2 voice GA |

## G · Post-sale & growth (Stage 8)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-19 | **Referral credit flow** | C12 / 8 | Handover asks for referrals; attribution is specced, the credit model is not (./research/journey.md §6.15) | v1 per ruling R15: referral = tagged attribution (referrer customer → new lead, source=referral) visible on both records; **no credits ledger v1**. Design the tag + "came from" chip only | Track A CRM core (referral tag + came-from chip); credits ledger = spec-locked exclusion (R15) |
| UXG-20 | **Installer/crew surface** (D29) | 8 | Crew has no login in v1; the InstallationSheet's "crew ticks" need an owner | Per ruling R16: coordinator (Manager role) runs the checklist on their device; optional free-text "done by" per step; money never shown. Crew login + role stay excluded by D29 (spec-locked, not a timeline deferral) | Track B projects |

## H · Studio refactor deltas (phase-10 mandates the mockups only partially cover)

The studio is **kept and refactored** (D39) with the ./research/phases710.md §2 tool census as the acceptance checklist. RoofSetup/Obstructions/PanelLayout/ProjectSetup mockups cover much of it; these deltas are mandated but not fully specified by any mockup.

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-21 | **Consolidated studio shell + header** | 10.1 | Audit found three header systems and a phantom step 5; no mockup defines the one shell | Single header: back · step title · Design Health chip · units · Save/Save-&-exit · Help · Next. Wizard renumbered to 9 visible steps (step 5 folded into Panel layout, ruling R7); step states not-started/in-progress/done/errors; mobile "3/9" step sheet | Launch-1 studio port |
| UXG-22 | **Mode toolbar + touch gesture layer (2D canvas)** | 10.3–10.6 | Phase-10's core interaction mandate: mode-based canvas, no modifier keys; 2D lacks pinch-zoom/two-finger pan entirely | Persistent mode bar (Select · Draw · Detect AI · Measure · per-step tools); one gesture = one undo step; tap-select-then-big-handles replaces ~9px handles; +/− steppers for precise nudge; visible labels, zero hover-only meaning | Launch-1 studio port |
| UXG-23 | **AI ghost review UX** | 10.3 | RoofSetup mockup shows a "ghost review" state tab, not the full accept/reject contract | Ghosts rendered distinct from committed geometry; per-shape confidence + include/exclude tap; imagery date/quality line; dropped-shape warnings; "add selected" commits as one undo step; provenance recorded (manual vs AI + confidence) | Launch-1 studio port |
| UXG-24 | **Studio sheet system** | 10.4–10.10 | Layout* sheet mockups exist (grow/string/table/why); the obstruction Settings sheet (setback → shadow → blocking → nested bridging chain) and the 375px BOM line-edit sheet do not | One sheet grammar for all editors: spring-in bottom sheet (mobile) / side panel (desktop), progressive disclosure for the bridging chain with the live clearance calc, BOM line edit with per-field provenance + reset. Blur-toward-white overlays per brand law | Launch-1 studio port |
| UXG-25 | **Scale-program surfaces** — blocks/zones editing, tracker tables, DEM/terrain import | 11-scale | 1 kW→100 MW is a committed design range (docs/11); zero mockups exist beyond LayoutTableSheet's single table | Design when each scale phase lands: zone draw → auto-tables, GCR/backtracking controls on the table sheet, DEM import status. Reuse the studio sheet grammar; block/table is the editable unit, panels derived | Scale Phases B/C (immediately after the 20-day build) |

## I · Accessibility findings (appended per register rule 3 — found by a gate, not a mockup review)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-A11Y-01 | **`--text-secondary` on `--canvas-sunken` measures ≈3.89:1** — used for the AvatarGroup "+N" overflow count at caption size | any | Found 2026-07-30 by the tokens contrast-coverage gate (docs/17 §5), not by review. WCAG AA needs **4.5:1** for normal text; caption/500 is not "large text" under any reading, so this failed AA. Ruling C (docs/10 §3.2) addresses `--text-secondary` on **white** (≈4.45:1) and does **not** cover the sunken surface. Nothing was checking this pairing at all. The vendored `_ds_bundle.js` reference specifies exactly this pairing, so the defect was inherited faithfully — `packages/ui/CLAUDE.md` resolves rulings over reference bugs. | **CLOSED (2026-07-30).** Both platforms now render the count in `--text-primary` on `--canvas-sunken` — **≈17.33:1**, an already-declared pair (floor 7). One token each in `packages/ui/src/data/Avatar.css` and `apps/mobile/src/ui/data/Avatar.tsx` (Law 7 lockstep), no layout change. **Superseded 2026-07-30 by the token fix (UXG-A11Y-03):** with `--text-secondary` itself now compliant, both platforms are back on the reference value (≈4.62:1) and the deviation is gone. Fixing the token beat special-casing one component. `--text-secondary`/`--canvas-sunken` is deliberately left OUT of `DECLARED_PAIRS`, so the coverage gate now fails the build if any component reaches for it again. | — (closed) |
| UXG-A11Y-03 | **SegmentedControl inactive label is `--text-secondary` on the `--canvas-sunken` track ≈3.89:1** (web `--fs-body-sm` 13px; RN mirror identical) | any | Found 2026-07-30 while closing UXG-A11Y-01, by hand — **the coverage gate cannot see this one**, and that is the proof of its documented blind spot: `.ui-segmented` sets the track background while `.ui-segmented-item` sets `background: transparent` + the label colour, so no single rule pairs the two. The label of a selectable option is meaning-bearing text and needs 4.5:1. Checked the neighbours: Tabs (web + RN) has **no** container background so its inactive label sits on surface/canvas at the sanctioned ≈4.45:1 — not affected. Button/IconButton ghost variants are `transparent` over surface/canvas — not affected. | **CLOSED (2026-07-30).** Also fixed at the token: `--text-secondary` darkened `#74787E`→`#686C71` (extension 6). The SegmentedControl inactive label on the `--canvas-sunken` track went **3.89:1 → 4.63:1**, and the same token on white went 4.45:1 → 5.29:1 — retiring ruling C's "borderline" caveat too. No component changed: the darker tone stays visibly lighter than `--text-primary`, so the active/inactive affordance the earlier analysis worried about is intact. The pair is now DECLARED, so the contrast gate checks it from here on. | — (closed) |
| UXG-A11Y-02 | **`--danger` ↔ `--surface` measures ≈3.91:1** — the destructive button's white label on the danger fill (15px/500) | any | Raised 2026-07-30 alongside UXG-A11Y-01. Ruling C sanctioned this colour pair at floor 3.8 with the note that it "clears WCAG AA for large text/UI components (≥3:1), not 4.5:1 body". On closer reading that allowance is **SC 1.4.11 non-text contrast**, which governs component boundaries and graphics — a button's **text label** is still governed by SC 1.4.3 and needs 4.5:1 at 15px/500. So the destructive button label is likely a real AA shortfall, not a covered exception. Flagged rather than acted on: unlike UXG-A11Y-01 there is no already-declared token to swap to, and any fix changes the design system's destructive identity. | **CLOSED (2026-07-30).** Fixed at the TOKEN, not the component: `--danger` darkened `#E5484D`→`#D34247` (extension 6, `packages/tokens/src/extensions.ts`). White label on the danger fill went **3.91:1 → 4.53:1**, and danger-as-text on white moved the same way, so ruling C's sub-AA annotation for this pair is retired rather than relaxed. The value is arithmetically the shade destructive buttons already hovered to, so the palette gained no new red. Verified in the running browser before adoption. | — (closed) |

## J · Cross-platform parity findings (found by a duplication audit, not a mockup review)

| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |
|---|---|---|---|---|---|
| UXG-PAR-01 | **RN login never surfaces a failed RESEND.** Web models three OTP failures (`mismatch`, `verify-failed`, `resend-failed`); RN modelled only two (`mismatch`, `transport`) inline, under a comment claiming "web parity" | auth-tenancy | Found 2026-08-01 while unifying the two hand-authored copies of the login state types into `@heliogrid/domain`. The types are now one definition, so RN can no longer diverge silently — but it still only ever PRODUCES `mismatch` and `verify-failed`. A resend that fails on RN clears the error state and shows nothing, so the user waits for an SMS that was never sent. `'transport'` was renamed to `verify-failed` (behaviour-neutral: same trigger, same copy). Not invented a fix here — RN needs a resend-failure branch and its copy, which is screen work owned by the auth rebuild, and Law "never invent a requirement" says the owner rules on it rather than me. | Add the `resend-failed` branch to the RN login screen with the web copy ("Couldn't send a new code. Try again."), or rule that RN deliberately collapses it and record why. Web already renders it. | auth rebuild |

## Cross-cutting note

Notification types for the new v1 systems — billing events (charge failed, trial ending), sync failures, number-provisioning status — extend the existing NotificationsCentre patterns; register them in each module's slice rather than as separate screens. Every gap above inherits the mockups' cross-cutting contracts: dual breakpoints, teaching empty states, provenance labels, sheets-not-pages, and the arc-nav/sidebar shells (./research/uxAL.md, ./research/uxMZ.md "Cross-cutting patterns").
