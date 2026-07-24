I now have everything I need. Let me compile the catalogue.

---

# HelioGrid UX — Screen Catalogue (AgentCallResult → LoginFlow, 35 files)

Source dir: `/Users/devtejas/Downloads/HelioGrid UX/` — all files are `*.dc.html` "declarative-component" mockups (a `<x-dc>` template + `data-dc-script` props, rendered by `support.js`). Most files are **multi-frame design documents**: they render the same screen in several states and at both **375px (mobile)** and **1440px (desktop)** side-by-side.

## Foundation: design system, runtime & helper JS

- **`_ds/heliogrid-design-system-…/`** — the HelioGrid design system package linked by every screen. Entry `styles.css`; `tokens/` = `colors.css` (+dark, though system is light-only), `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `fonts.css`, `base.css`; `assets/fonts/` = Geist + Geist Mono (variable woff2); `_ds_bundle.js` = compiled React component library exposed as `window.HelioGridDesignSystem_c8aa43` (Button, IconButton, Input, Checkbox, Radio, Switch, Card, IconCircle, StatCard, StatusChip, Chip, Badge, Avatar, AvatarGroup, ListRow, EmptyState, ProgressBar, OfflineBanner, Toast, SegmentedControl, Tabs); `_ds_manifest.json`; `_adherence.oxlintrc.json` (lint rules enforcing "no raw hex/px/borders"); `readme.md` (full brand law). **Governing rule:** hierarchy from luminance + soft shadow, never lines; iridescent gradient is atmosphere only; primary action is near-black; two density modes (Expressive mobile / Functional desktop). Two font weights (400/700, 500 for buttons/headers). Signature **overline** micro-labels (11px/700/0.12em uppercase) head every section.
- **`support.js`** — "GENERATED from dc-runtime". The rendering runtime: `parseDcDocument`/`parseDcText` pull the `<x-dc>` template + `data-props` JSON, and a tiny React shim (`getReact`, `h = createElement`) renders the `<sc-for list>` / `{{ binding }}` templates into live DOM. This is what turns each static `.dc.html` into an interactive mockup; **it is tooling, not product code.**
- **`image-slot.js`** — defines the `<image-slot>` custom element: a user-fillable image placeholder (drag-drop or click-to-browse, crop/reframe, persisted to a sibling `.image-slots.state.json` sidecar). Used anywhere a mockup needs a real photo — roof/site photos, company logo, team photo, avatars, customer proposal hero. Read-only outside the authoring runtime. Also tooling.
- **`uploads/product-journey.md`** — the product bible (36 locked decisions D1–D36, 8-stage journey map). Confirms scope, roles, and which screens exist. **This is the single best architecture input in the folder.**

---

## Screen-by-screen

### 1. AgentCallResult — `/Users/devtejas/Downloads/HelioGrid UX/AgentCallResult.dc.html`
- **Purpose:** The lead-timeline artifact after the **voice agent ("Asha")** handled/handed off a call. "Asha handed this call to you."
- **Layout:** Lead-detail context header (name, stage) → agent-call result card → "Recent timeline" list. Call-result card holds outcome, interest signal, recording player, transcript.
- **Interactions:** Play the recording · Read the transcript · **Correct the outcome** (human override — "Your read always wins", "Corrected by you") · Open lead · See notification · Save change / Cancel.
- **Data:** Outcome ("Proposal sent" / "The customer declined it"), interest level, timestamp ("6 days ago"), customer (Anita Rao), rep, "No recording" fallback.
- **Mobile/Desktop:** Both 375 + 1440 frames.
- **New SaaS surface:** Yes — entire voice-agent subsystem absent from POC.

### 2. AgentKnowledge — `/Users/devtejas/Downloads/HelioGrid UX/AgentKnowledge.dc.html`
- **Purpose:** The tenant-owned **knowledge base** driving what the agent tells customers (D24/D36). "What Asha knows / What Asha tells your customers."
- **Layout:** Settings › voice agent. Left "Sections" nav (Business knowledge, Common objections, Anything else) → editable knowledge cards → "Keeps improving" feedback loop.
- **Interactions:** Add / Save / Remove / Cancel / Done knowledge entries; "See what customers asked" (links to Unanswered); free-text box per D24.
- **Data:** Grouped Q&A / objection-handling entries, section labels.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes.

### 3. AgentPerformance — `/Users/devtejas/Downloads/HelioGrid UX/AgentPerformance.dc.html`
- **Purpose:** Reports › voice agent — ROI dashboard. "Agent performance / This month."
- **Layout:** KPI stat-card row → outcomes breakdown → alert banner → per-call log.
- **Interactions:** Review the import · Review unanswered · drill into "Every call".
- **Data:** Calls made (738), connected (412), minutes used (246, plan allowance ≈20 hrs), outcomes, deals touched, "What it saved you" (₹1.4 Cr), **alert overline** "Connect rate dropped — 60% to 38% this week."
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes.

### 4. AgentQueue — `/Users/devtejas/Downloads/HelioGrid UX/AgentQueue.dc.html`
- **Purpose:** Settings › voice agent — live **call queue**: "Who Asha will call, and why."
- **Layout:** Title → "On a call now" live card (pulsing live dot) → queued list with "Why they're queued" reason chips → "Calling window" config → empty state "Nobody scheduled right now."
- **Interactions:** Open live result · Open lead · Keep / Remove from queue · Change in settings · Agent settings.
- **Data:** Queue entries with trigger reason (proposal unopened 3d, task overdue 2d, 3 failed attempts — D17), calling window (9am–9pm default), live call transcript preview.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes.

### 5. AgentSetup — `/Users/devtejas/Downloads/HelioGrid UX/AgentSetup.dc.html`
- **Purpose:** Guided **agent configuration** wizard (D36 — fully tenant-configurable). "Set up your agent / Meet {name}, your assistant."
- **Layout:** Long settings form of overline-headed blocks: Its name · Voice · Tone · Languages it speaks · Opening line · When it may call · When to hand the call to a person · When it doesn't know something · Anything else (free text) · **Preview** panel ("Your setup").
- **Interactions:** Fill each field, live Preview, Save; "What it knows" cross-link.
- **Data:** Name, voice, tone, language multi-select (Hindi/Marathi/Gujarati/Tamil/Telugu/English), opening line, calling schedule, hand-over rules.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes — a core multi-tenant config surface.

### 6. AgentTest — `/Users/devtejas/Downloads/HelioGrid UX/AgentTest.dc.html`
- **Purpose:** "Hear Asha before your customers do" — sandbox test call before enabling.
- **Layout:** Test-call panel ("Test call in progress") → she'll-open-with script → **Live transcript** → "Sounds off? Fix it" remediation.
- **Interactions:** Test again · Try typed again (typed mode) · Start typing · Fix knowledge · Fix the script · **Turn the agent on**.
- **Data:** Agent name, opening line, live transcript turns.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes.

### 7. AgentUnanswered — `/Users/devtejas/Downloads/HelioGrid UX/AgentUnanswered.dc.html`
- **Purpose:** Feedback loop — "What customers asked that Asha couldn't answer" → one-tap knowledge additions (D24).
- **Layout:** List of unanswered questions, each with an "Answer this" action; "How this works" explainer; empty state "All caught up" (answeredCount).
- **Interactions:** Answer this · View in knowledge · Dismiss / Not worth answering · Cancel · Agent performance cross-link.
- **Data:** Asked question, frequency, answered count.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes.

### 8. Billing — `/Users/devtejas/Downloads/HelioGrid UX/Billing.dc.html`
- **Purpose:** Settings 8.7 — "Billing & subscription — the shape, ready for real pricing" (**mock pricing**, D26).
- **Layout:** Current plan card → Payment method → Invoices & GST receipts table → Compare plans grid → "Your data is always yours" export block.
- **Interactions:** Upgrade or change plan · Manage (payment) · Download invoice · Export all my data · Not now.
- **Data:** Plan name/price (sample), payment method, GST invoices (with GSTIN for input tax credit), "Export every lead, quote and invoice — even now."
- **Mobile/Desktop:** Desktop "sidebar stays"; **Mobile 375 — companion · back ‹ · no bottom nav** (a settings sub-screen pattern).
- **New SaaS surface:** Yes — subscription/billing is entirely new.

### 9. BizDocPreview — `/Users/devtejas/Downloads/HelioGrid UX/BizDocPreview.dc.html`
- **Purpose:** Small preview of the **business/company document** as it appears on a proposal ("Rooftop solar proposal / About us / Prepared for").
- **Layout:** Document letterhead card — company identity, "About us" story, prepared-for block, team photo slot.
- **Interactions:** Minimal (preview only).
- **Data:** Company name, proposal no. (HG-2026-0142), date (12 Mar 2026), customer (Priya Sharma), team photo (`<image-slot>`).
- **Mobile/Desktop:** Compact preview.
- **New SaaS surface:** Partial — feeds proposal; the branded-doc header is new.

### 10. BomDetail — `/Users/devtejas/Downloads/HelioGrid UX/BomDetail.dc.html`
- **Purpose:** Internal, line-by-line **bill of materials** — "the price, line by line."
- **Layout:** Header (customer · HG-2026-0142 · "from design") → line-item table → Line detail. Marked **Internal**.
- **Interactions:** Back to proposal · Export / Export CSV.
- **Data:** Component line items, quantities, unit prices, grand total incl. GST.
- **Mobile/Desktop:** Desktop table; **Mobile 375 — card list, detail as sheet.**
- **New SaaS surface:** Overlaps POC (`Step9Bom` / `lib/bom`) but the standalone internal BOM-detail page + CSV export is new.

### 11. BomView — `/Users/devtejas/Downloads/HelioGrid UX/BomView.dc.html`
- **Purpose:** Read-only BOM view within a proposal, incl. empty state.
- **Layout:** Specification list → "Grand total · incl. GST"; empty state "No bill of materials for this proposal" → "Attach a design."
- **Interactions:** Attach a design.
- **Data:** Spec lines, GST-inclusive total.
- **Mobile/Desktop:** Both implied.
- **New SaaS surface:** Overlaps POC BOM; empty/attach flow is new.

### 12. BusinessProfile — `/Users/devtejas/Downloads/HelioGrid UX/BusinessProfile.dc.html`
- **Purpose:** Settings 8.2 — "Business profile & branding — the identity that feeds everything" (logo/GSTIN/story that populate proposals).
- **Layout:** Two-column: Identity form (name, GSTIN, address, bank, logo upload) + Company story → **Live preview** of branded output.
- **Interactions:** Save / Save changes / Cancel · logo "Choose another file" upload (dashed drop zone).
- **Data:** Company identity fields, logo (`<image-slot>`), narrative, live preview.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes — tenant branding/identity is new (multi-tenant white-label input).

### 13. CatalogPriceBook — `/Users/devtejas/Downloads/HelioGrid UX/CatalogPriceBook.dc.html`
- **Purpose:** Settings 8.3 — "Catalog & price book — what you sell and what it costs." Tenant product/rate master.
- **Layout:** Search + category-grouped product list; per-product: customer description, current rate, rate history.
- **Interactions:** Add product · Edit rate (New rate; "Saving creates a new rate", keeps Rate history) · Search catalog · Archive · Cancel.
- **Data:** Product name, category, customer-facing description ("the plain line on the proposal"), current rate, rate history, archived flag.
- **Mobile/Desktop:** **Desktop 1440 — dense table by category · sidebar stays**; **Mobile 375 — card list · edit as bottom sheet · no wide table.**
- **New SaaS surface:** Yes — catalog/price-book admin absent from POC (POC has BOM emitters/hardware, not an editable price book).

### 14. Components — `/Users/devtejas/Downloads/HelioGrid UX/Components.dc.html`
- **Purpose:** Proposal **Step 4 · Components** — pick panel + inverter + DC topology (components mandatory per D22).
- **Layout:** Stepper ("Next · Panel layout") → panel picker → inverter picker → DC collection topology → specs.
- **Interactions:** Choose a panel / inverter · Change panel · Keep the current panel · Filter panels (Approved List only / Domestic content only / min–max watt) · Compare options · Enter specs manually · Upload datasheet · toggle String inverters / DC optimisers / Module-level electronics · Continue to inverter.
- **Data:** Recommended sizing "From your ₹4,200/month bill we recommend…", Google Solar / PVGIS estimates, panel electricals (49.7 V, 41.8 V, 13.9 A), inverter count, "4/10" progress.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Overlaps POC (`Step4Components`) — this is a redesign, not new.

### 15. CoverageFailure — `/Users/devtejas/Downloads/HelioGrid UX/CoverageFailure.dc.html`
- **Purpose:** Remote survey 5.4 — "No detailed roof data here" fallback when Solar API has no coverage. "Not a dead end."
- **Layout:** Explanatory card → manual roof-drawing canvas ("Hand outline") → alternative CTA.
- **Interactions:** Draw the roof (Undo / Undo point / Clear / Redraw) · Book a visit (physical fallback).
- **Data:** Usable area (m²) computed from hand-drawn outline.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes — remote-survey UX not in POC (POC has `solarApi.ts` lib but no survey screens).

### 16. CustomerPage — `/Users/devtejas/Downloads/HelioGrid UX/CustomerPage.dc.html`
- **Purpose:** The **customer-facing project page** after the deal is won — same tokenized URL evolves from proposal to live-system status (D5, no login).
- **Layout:** Hero "Your 8.2 kWp system · Nashik / Your system is live" → project status stepper (Commissioned 26 Aug 2026 · generating now) → System size · You pay · generation reading → Payment stages → Your documents → Refer a friend.
- **Interactions:** Confirm/accept ("You're accepting the 8.2 kWp system for ₹3,51,847"), agree to terms checkbox, Refer a friend, ask a question, Back to proposal / View original proposal, drag-to-look-around 3D.
- **Data:** System size (8.2 kWp), price (₹3,51,847, ₹4,52,471, subsidy ₹70,369), live generation (11,840 units), payment stages ("Next payment · on installation", ₹…), documents, GST (27ABCDE1234F1Z5), referral credit.
- **Mobile/Desktop:** Both (mobile-first customer link).
- **New SaaS surface:** Yes — customer portal only partially exists in POC (`ShareViewer.tsx`); the won→commissioned→handover progress view is new.

### 17. CustomerProposal — `/Users/devtejas/Downloads/HelioGrid UX/CustomerProposal.dc.html`
- **Purpose:** "The page Priya opens from WhatsApp" — the master **customer proposal link** design doc, covering the full lifecycle across one URL (D5/D32/D33).
- **Layout:** A **state matrix** (States A–F): 1 proposal-with-design, 2 proposal-without-design (honesty label), 3 ask-a-question, 4 accepting, 5 project-progress (deal won), 6 handover-complete; plus 3D roof states (static / open desktop overlay / full screen / loading / unavailable fallback) and edge states: Expired link, Invalid/wrong link, Superseded (v2 exists), Declined (calm, reopenable), Reopened-later-accepted, Confirmed.
- **Interactions:** Accept (Confirm sheet) · Ask a question (Question sheet) · Decline/reopen · open 3D.
- **Data:** Same commercial figures as CustomerPage; "Sent · Rajesh will call."
- **Mobile/Desktop:** Explicit **Mobile 375** and **Desktop 1440 — centred document.**
- **New SaaS surface:** Yes — the tokenized multi-state customer link (accept, question, tracking, edge states) is a major new surface vs POC's basic `ShareViewer`.

### 18. DesignStudio — `/Users/devtejas/Downloads/HelioGrid UX/DesignStudio.dc.html`
- **Purpose:** Redesign shell of the **design studio** (Stage 5, low-priority per D23) — design list + step-driven editor + health.
- **Layout:** Designs list (empty state "No designs yet") → editor with step panels ("Steps · {indicatorText}", All steps) → right-side **Design health** score panel; variants row ("3 variants · one recommended").
- **Interactions:** New design · Duplicate · Open · Save · Add obstruction · step navigation · gate blocks ("Can't continue — 3 panels aren't in a string / Balance inverter B" — Electrical gate).
- **Data:** Design health score (provisional while "Recalculating shading"), Generation, Payback, Deductions, System size, "What changed since last save," 3 variants w/ recommended.
- **Mobile/Desktop:** Both (D2 mobile parity for studio).
- **New SaaS surface:** Overlaps POC (`Wizard.tsx`, `Step6Editor`, `health.ts`) — redesign of existing studio.

### 19. DetectRoof — `/Users/devtejas/Downloads/HelioGrid UX/DetectRoof.dc.html`
- **Purpose:** Remote survey 5.3 — "Detect & review the roof": AI roof detection over satellite imagery, editable (Accept/adjust/reject, D30/D35).
- **Layout:** "Detecting" progress → detected roof overlay with editable Roof outline + Obstructions → "Estimates · from satellite imagery" panel.
- **Interactions:** accept/adjust/reject detections, edit outline, add/remove obstructions, confidence per detection.
- **Data:** Usable area (m²), pitch/azimuth estimates, obstruction list — all labelled **derived from imagery** (honesty rule N7).
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes — remote-survey detection UX new (POC has `roof-ai/` lib, no survey screen).

### 20. GapsRemote — `/Users/devtejas/Downloads/HelioGrid UX/GapsRemote.dc.html`
- **Purpose:** Remote survey 5.5 — "Gaps remote can't fill": what satellite can't determine, routed to customer/site visit.
- **Layout:** Gap checklist (meter, sanctioned load, roof condition, access, hidden shading, ownership) each with resolution route → "Photos for the designer" attach block → "Gaps resolved" state.
- **Interactions:** Ask customer · On the visit · Book a visit for the rest.
- **Data:** Gap items, resolution status, attached reference photos.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes.

### 21. GlobalSearch — `/Users/devtejas/Downloads/HelioGrid UX/GlobalSearch.dc.html`
- **Purpose:** App-wide search across leads, customers, sites, proposals, projects.
- **Layout:** Command-palette overlay: search field → grouped results ({g.heading}) → scoped fallback.
- **Interactions:** type query · Cancel · Browse all leads · Open the leads filter · "Looking only in your leads?" scope hint.
- **Data:** Result groups by entity type; placeholder "Search name, phone or city."
- **Mobile/Desktop:** **Mobile 375 — full-screen overlay**; desktop dropdown palette (with left sidebar: My Day/Leads/Projects/Reports/Settings).
- **New SaaS surface:** Yes — global search absent from POC.

### 22. InviteFlow — `/Users/devtejas/Downloads/HelioGrid UX/InviteFlow.dc.html`
- **Purpose:** Employee **join** flow (Stage 1) — "Join Suryodaya Solar" via invite → OTP → profile.
- **Layout:** Multi-step: invite accept → OTP entry → "Set up your profile" (name + optional photo) → expired-invite state.
- **Interactions:** Continue · Resend code / Call me with the code instead · Remove/add photo · "Ask Rajesh to invite me again" (expired) · Restart demo.
- **Data:** Company (Suryodaya Solar), inviter (Rajesh Patil), pre-filled phone (locked, "can't be changed"), city (Pune, Maharashtra), demo OTP 424242.
- **Mobile/Desktop:** Mobile-first (phone onboarding).
- **New SaaS surface:** Yes — team invite/onboarding is new multi-tenant surface.

### 23. InviteLanding — `/Users/devtejas/Downloads/HelioGrid UX/InviteLanding.dc.html`
- **Purpose:** "Join a company" invite landing + profile — the entry card an invited user first sees.
- **Layout:** Explicit Desktop (1440 px) and Mobile (375 px) frames of the landing.
- **Interactions:** proceed to InviteFlow.
- **Data:** Company/inviter, phone.
- **Mobile/Desktop:** Both labelled explicitly.
- **New SaaS surface:** Yes.

### 24. LayoutConnList — `/Users/devtejas/Downloads/HelioGrid UX/LayoutConnList.dc.html`
- **Purpose:** Design-studio panel-layout sub-sheet — "String connections": every string and the exact chain of panels in it.
- **Layout:** List/sheet of strings with panel chains.
- **Interactions:** inspect string composition.
- **Data:** Strings, ordered panels per string.
- **Mobile/Desktop:** Sheet component (used inside PanelLayout).
- **New SaaS surface:** Overlaps POC stringing (`stringing.ts`, `Step6Editor`) — UI sheet refinement.

### 25. LayoutGrowSheet — `/Users/devtejas/Downloads/HelioGrid UX/LayoutGrowSheet.dc.html`
- **Purpose:** Panel-array "grow" controls sheet — auto-expand the array.
- **Layout:** Bottom sheet with Axis, Column, Count, "Grow from," More grow options.
- **Interactions:** set grow axis/anchor/count.
- **Data:** Grow direction, column, count.
- **Mobile/Desktop:** Bottom-sheet component.
- **New SaaS surface:** Overlaps POC editor — new UI affordance.

### 26. LayoutSelPanel — `/Users/devtejas/Downloads/HelioGrid UX/LayoutSelPanel.dc.html`
- **Purpose:** Panel selection panel + **locked** state — "Unlock the layout to edit these panels."
- **Layout:** Selection sidebar/panel with Locked overlay.
- **Interactions:** select panels; unlock to edit.
- **Data:** Selected-panel set, lock state.
- **Mobile/Desktop:** Panel component.
- **New SaaS surface:** Overlaps POC editor.

### 27. LayoutStringSheet — `/Users/devtejas/Downloads/HelioGrid UX/LayoutStringSheet.dc.html`
- **Purpose:** Stringing sheet — "Stringing": auto/manual string configuration + wiring.
- **Layout:** Sheet with Auto string / Manual string toggle, Cold-weather Voc, "Wiring string C."
- **Interactions:** Auto string · Manual string · Save string · Clear strings · Cancel.
- **Data:** String assignments, cold-weather Voc calc.
- **Mobile/Desktop:** Sheet component.
- **New SaaS surface:** Overlaps POC `stringing.ts`.

### 28. LayoutTableSheet — `/Users/devtejas/Downloads/HelioGrid UX/LayoutTableSheet.dc.html`
- **Purpose:** Ground/table **racking structure** sheet for a mounting table.
- **Layout:** Sheet with tilt/azimuth/racking controls + computed steel/shading.
- **Interactions:** Panel tilt · Azimuth (Due south) · Roof slope · Structure preset / member model · Racking · Leg spacing · Clearance · **Apply shadow-free spacing** · Duplicate table · Delete table.
- **Data:** Winter shadow-free row pitch, Inter-row shading, Total steel (248 kg), member (1.85 m), Table A.
- **Mobile/Desktop:** Sheet component.
- **New SaaS surface:** Overlaps POC `structure.ts`/`foundation.ts`/`ground.ts` — UI sheet.

### 29. LayoutValList — `/Users/devtejas/Downloads/HelioGrid UX/LayoutValList.dc.html`
- **Purpose:** Layout **validation** list — design-rule-check results in the studio.
- **Layout:** Validation list with actions.
- **Interactions:** Auto-string now · Locate (jump to offending element).
- **Data:** Validation issues.
- **Mobile/Desktop:** Sheet/panel component.
- **New SaaS surface:** Overlaps POC `drc.ts` / `review.ts`.

### 30. LayoutWhySheet — `/Users/devtejas/Downloads/HelioGrid UX/LayoutWhySheet.dc.html`
- **Purpose:** "Why this layout?" — explains auto-design decisions (transparency for auto-design).
- **Layout:** Sheet: Suggestions list + Decision log ("What the auto-design chose, and where it can improve").
- **Interactions:** Accept / Ignore each suggestion.
- **Data:** Auto-design rationale, improvement suggestions, decision log.
- **Mobile/Desktop:** Sheet component.
- **New SaaS surface:** New explainability UI over POC `auto-design.ts` — a new surface.

### 31. LeadDetail — `/Users/devtejas/Downloads/HelioGrid UX/LeadDetail.dc.html`
- **Purpose:** "Lead detail — one lead, one place" (Stage 3) — the CRM record hub.
- **Layout:** Header (name, phone, city, value, stage, owner) → tabbed/stacked sections: **Activity timeline · Qualification · Site · Designs & proposals · Tasks · Files.**
- **Interactions:** Call/Log activity · Add task · Create design · Create proposal · **Survey the roof** · Disqualify (Reason) · Reassign · Snooze / **Wake up now** (snooze is first-class, D-recommendation) · Mark won.
- **Data:** Timeline (incl. voice-agent transcript entries), qualification (bill ₹, roof ownership/type, shading, timeline, decision maker), site info, "Snoozed till 12 Aug 2026", empty states ("No site details yet. They fill in after the survey").
- **Mobile/Desktop:** Both (field-app header + desktop master-detail).
- **New SaaS surface:** Yes — CRM lead record absent from POC (POC is studio-only).

### 32. Leads — `/Users/devtejas/Downloads/HelioGrid UX/Leads.dc.html`
- **Purpose:** "Leads — find and scan the pipeline" — the pipeline list/table (Stage 2/3).
- **Layout:** Filter/sort bar → lead list (mobile cards / desktop table). Desktop columns: name, Stage, Estimated value, System size, Last contact, Next action, Sales rep, Lead created.
- **Interactions:** Add lead (FAB / Add a lead) · Filters (Stage, Sort by, Clear all/Clear filters) · Assign · Snooze · Open lead · Export · bulk-select. Empty states: "No leads yet", "No leads match these filters."
- **Data:** Per-lead: name (Anita Rao), stage, value, size, last contact, next action, owner; "Recent activity."
- **Mobile/Desktop:** **Mobile 375** card list + **Desktop 1440** dense table (also a 1280 breakpoint) with sidebar (My Day/Leads/Projects/Proposals/Site visits/Notifications/Settings).
- **New SaaS surface:** Yes — pipeline/CRM list absent from POC.

### 33. LocateBuilding — `/Users/devtejas/Downloads/HelioGrid UX/LocateBuilding.dc.html`
- **Purpose:** Remote survey 5.2 — "Locate the building": confirm the right roof on satellite before detection.
- **Layout:** Satellite map with building highlighted + confirm CTA.
- **Interactions:** "This is the right roof" / "Done — this is the right roof" · "No clear imagery here?" (→ CoverageFailure).
- **Data:** Address, satellite preview, building outline.
- **Mobile/Desktop:** Both.
- **New SaaS surface:** Yes — remote-survey step new (POC has `maps.ts`/`geo.ts` lib, no locate screen).

### 34. Login — `/Users/devtejas/Downloads/HelioGrid UX/Login.dc.html`
- **Purpose:** "Sign in" (Journey stage 1) — the login entry, shown at both breakpoints.
- **Layout:** Explicit **Desktop 1440 px** and **Mobile 375 px** frames of the sign-in screen; phone-number-first, "Sign in."
- **Interactions:** enter phone → continue (into LoginFlow OTP). Demo code 424242.
- **Data:** Phone field.
- **Mobile/Desktop:** Both explicit.
- **New SaaS surface:** Overlaps POC `Login.tsx`, but multi-tenant phone/OTP auth is a new model vs POC's placeholder.

### 35. LoginFlow — `/Users/devtejas/Downloads/HelioGrid UX/LoginFlow.dc.html`
- **Purpose:** Full **OTP sign-in flow** (Stage 1) — phone → 6-digit code → landed. "Welcome back. Taking you to your day."
- **Layout:** Sequential frames: Mobile number → "Enter the 6-digit code" → "You're signed in" → role-home redirect.
- **Interactions:** Continue · Change number · Resend code (30s timer) · Call me with the code instead · "Still no code after two tries?" · Create an account ("New company?") · Restart demo.
- **Data:** Phone, OTP (demo 424242, "Sent by SMS to your registered number"), success message.
- **Mobile/Desktop:** Mobile-first.
- **New SaaS surface:** Yes — passwordless OTP auth + "new company" self-serve signup fork (D11) is new.

---

## CROSS-CUTTING PATTERNS

**Navigation model (role-driven, D31/Stage 1):**
- **Mobile = Arc bar** with elevated brass centre button: **My Day · Leads · ➕ Add (centre) · Projects · More.** Centre verb adapts by role (surveyor = "Start survey"). Settings sub-screens drop the bottom nav and use a **"companion · back ‹"** header instead (seen in Billing/Catalog).
- **Desktop = left sidebar + top header.** Sidebar items observed: **My Day, Leads, Projects, Proposals, Site visits, Reports, Notifications, Settings** (plus user chip "Rajesh Patil / Sales rep"). Sidebar "stays" on settings sub-pages.
- **Role decides the home screen** (rep→My Day, surveyor→today's visits, designer→designs, owner→dashboard) — same app, five front doors.

**App shell / density:** Every screen sets `min-width:100%` canvas (`--canvas` warm grey) with white floating surfaces, overline breadcrumb (`HelioGrid · section · n.n`) + 26px title header. **Expressive mode** (mobile, onboarding, auth, dashboards, empty states — big radii, ambient bloom) vs **Functional mode** (desktop tables, settings, catalog — tight, still borderless, zebra rows).

**List/detail conventions:** Desktop uses **dense tables by category with a persistent sidebar**; the *same* data becomes a **mobile card list with detail-as-bottom-sheet** (explicitly annotated in Billing, Catalog, BomDetail). Master-detail on desktop; drill-to-full-screen on mobile. Right-aligned tabular-nums for currency/quantities.

**Sheet patterns:** Bottom sheets (spring-in) are the primary mobile editor surface — used for the design-studio layout controls (Grow/String/Table/Sel/Conn/Val/Why sheets), catalog rate edits, BOM line detail, customer Accept/Question sheets. Overlays **blur + fade toward white, never darken** (brand law). Global search is a full-screen overlay on mobile / palette dropdown on desktop.

**Multi-state design docs:** Nearly every `.dc.html` renders **many states + both breakpoints in one file** (e.g., CustomerProposal States A–F + 3D states + error states; Leads/DesignStudio show empty + populated + filtered). Edge/empty/error/expired states are first-class, always designed (encouraging empty states, honesty labels on derived data).

**Domain & content:** Indian currency grouping (₹4,52,471), kWp/units, GST/GSTIN/DISCOM, Geist + Geist Mono for IDs/readings, demo OTP `424242`, sample tenant "Suryodaya Solar" / rep "Rajesh Patil" / customers "Priya Sharma / Anita Rao", cities Nashik/Pune/Ahmednagar. **Voice agent = "Asha."**

**Auth model:** Passwordless **phone → OTP** everywhere (Login, LoginFlow, InviteFlow), with "call me the code" fallback, resend timer, demo/restart affordances, and a **self-serve "new company" signup** fork.

---

## NOTABLE GAPS (referenced but not in this A–L range / not in POC)

- **Screens in the journey referenced but living in the *second half* of the folder (M–Z), not catalogued here:** My Day (home/`MyDay`), NotificationsCentre, OwnerDashboard, RepDashboard, PipelineFunnel, PanelLayout (parent of the Layout* sheets above), Obstructions, RoofSetup, ShadingCapture/SurveyMode/SurveyReview/SurveyorVisits (physical survey), ProjectSetup/"Project Flow", the Proposal* builder set (11-step, D21), ProposalShare/Preview/Versions, Settings/ProfilePreferences/TeamRoles/RoleFlow/MessageTemplates, QuickAddLead, DetectRoof siblings, DesignStudio/StudioPlaceholder, ReadyFlow/SellFlow/SetupLater/SignUp(Flow)/WhatYouSell/YourRole/YoureReady (onboarding), MessageTemplates, ProposalDefaults(Sheet). The Layout* sheets here are **children of PanelLayout** — that parent is in the second half.
- **Journey stages with no screen file at all in the folder:** Stage 2 **CSV import / column-mapping / "90 duplicates" preview**, **Duplicate-found** dedupe sheet (D13), **Capture settings** (website form snippet / WhatsApp number), and **Assign** load-balancer screen (D14) — all named in `product-journey.md` but no matching `.dc.html` seen.
- **Stage 8 Handover / execution** is explicitly TBD (D9) — CustomerPage shows the *customer-visible* "commissioned/handed over" end state, but the internal execution tracker screens are out of v1.
- **What the current POC (`/Volumes/works-space/Solar-App-POC`, feature `solar-studio`) does NOT have — every non-studio surface above is net-new:** the POC is only the **design studio + proposal/BOM/SLD wizard** (Step1Setup→Step10Done, Dashboard, Login, ProposalView, ShareViewer, InstallationSheet; libs for roof-AI, auto-design, stringing, structure, shading, PVGIS/Solar API, finance, BOM). It has **none** of: the CRM (Leads, LeadDetail, GlobalSearch), **voice-agent suite** (all 7 Agent* screens), **remote-survey UX** (LocateBuilding/DetectRoof/CoverageFailure/GapsRemote — libs exist, screens don't), **multi-tenant onboarding/auth** (Login/LoginFlow/Invite*), **tenant admin/settings** (Billing, BusinessProfile, CatalogPriceBook), and the **evolving tokenized customer link** (CustomerProposal/CustomerPage/BizDocPreview) beyond a basic ShareViewer. These are the SaaS surfaces to build around the existing studio.