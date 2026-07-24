I now have a complete picture across all target files plus the master spec and both image folders. Compiling the catalogue.

---

# HelioGrid UX Spec Catalogue — `MessageTemplates` → `YoureReady`

**Format note.** Every `*.dc.html` is a self-contained "design-canvas" mockup on the locked **HelioGrid "Instrument" design system** (`_ds/heliogrid-design-system-…`: graphite + brass, ink-on-brass fills, token CSS for fonts/colors/spacing/radius/elevation/motion). Screens are authored with an `sc-if`/`sc-for` templating DSL driving **realistic seeded data** (Priya Sharma / Suryodaya Solar / Nashik, ₹ values, HG-P-#### IDs) and **explicit state variants** (empty / normal / done / error). Nearly all full screens render **two side-by-side device frames — `Mobile · 375` and `Desktop · 1440`** — with inline captions describing the responsive strategy. Titles carry a purpose clause after an em-dash, which I use as the "purpose" below.

**POC baseline (what already exists, for the gap column).** The POC (`/Volumes/works-space/Solar-App-POC`) is a Next.js app whose only real surface is the **Solar Studio design wizard** (`(studio)/wizard/[step]`, `proposal`, `share/[shareId]`, `projects`, `login`, `/design` token page) backed by `features/solar-studio` (satellite tracing, obstructions, panel layout, 3D shadow sim, SLD, BOM, finance, DRC, catalog/pricebook/discom/gst data). The uploads screenshot confirms it: `localhost:3000/wizard/2 · Step 2 of 10 · Roof Setup`, a working 3D sun-path shadow view. **Everything outside the design studio in this spec set is net-new.**

---

## Image folders (sampled)

- **`screenshots/`** — small (3–40 KB) **rendered exports of the `.dc.html` mockups themselves**, showing the mobile+desktop frames and state-tab strips. Confirmed samples: `board-desktop-filters.png` = *Projects board* (state tabs Board / Filtered:Installation / Aged-stuck / Money owed / Empty; mobile one-column + desktop full board with HelioGrid sidebar); `3d.png`/`3d-desk.png`/`3d2/3d3` = *RoofSetup* studio (state tabs Empty/Drawing/Roof selected/AI ghost review/Height&parapet/Calibration/Dependent-items/3D preview; blue roof polygon on green grid, snap toggle, measure tool); `roof-audit.png`, `survey-surveyor-dropdown.png`, `cat-add*.png` (catalog add), `ho-done-*` (handover done card), `01/02/03-s.png` + `01/02-studio-list.png` (studio list thumbnails). These are **design-review artifacts, not app screenshots.**
- **`uploads/`** — the **source-of-truth material**: four near-identical drafts of **`product-journey*.md`** (1740 lines / ~16k words each — full product narrative, Stages 0–8 + customer journey C1–C13 + tenant config + roles + arc-nav spec; the 4 hashes differ = iterations). Plus **real running-POC screenshots** (`Screenshot 2026-07-24 at 5.49.03 PM.png` = live `/wizard/2` 3D shadow studio with Google/Airbus imagery, sun-path arc 6am–7pm scrubber, Winter/Summer/Equinox/Today toggles, m/ft + Health header; the other dated screenshots + `draw-…png` are working-app captures/sketches). This folder is where the architecture plan's requirements actually live.

---

## SETTINGS / TENANT CONFIGURATION cluster

- **`Settings.dc.html`** — *Settings home, the configuration hub* (`Settings · 8.x`). Layout: a directory of rows, each labeled with the sub-screen it opens (`Opens from "Business profile" 8.2`, `Catalog & price book 8.3`, `Message templates 8.5`, `Team & roles 8.6`, `Billing 8.7`). Interactions: navigate into each config area; "Business, agent, team and billing managed by owner." M+D: desktop reached from sidebar ("owner at a desk"), mobile from `More › Settings`, nested, back-‹, **no bottom nav**. Notes "nothing here is required — defaults already work." **Not in POC:** no settings hub at all.
- **`ProposalDefaults.dc.html`** — *Proposal defaults & templates — every new proposal starts 90% filled* (`8.4`). Layout: **seven sections on the left, a live proposal preview on the right** (desktop); mobile = section list + editors-as-sheets. Data: each section pre-fills one proposal-builder step (savings/financing defaults, warranty, T&C, tranche sets, timeline phases). Interactions: edit defaults, "Preview a proposal." **Not in POC** (POC hardcodes defaults in `data/profiles.ts`/`pricebook.ts`).
- **`ProposalDefaultsSheet.dc.html`** — component partial: **bottom-sheet editors** for the above (named tranche-set chips each totaling 100%, cancellation/restocking terms, workmanship-warranty text, default timeline phases reorderable → feed step 6, India savings/financing defaults → steps 3 & 5). **Not in POC.**
- **`MessageTemplates.dc.html`** — *Message templates — the wording your team pastes into WhatsApp* (`8.5`). Layout: templates list + editor; desktop keeps sidebar, mobile editor is a sheet with back-‹. Data: each template in **three languages (English / हिंदी / मराठी)** with insertable auto-fill placeholders. Controls: Edit / Save template / Copy message / Cancel; copy is manual ("HelioGrid doesn't send it for you"). **Not in POC** (no messaging, no i18n).
- **`TeamRoles.dc.html`** — *Team & roles — who's on the team and what they can do* (`8.6`). Layout: member card list + **Roles reference** (six fixed presets, read-only in v1). Controls: Invite someone (WhatsApp invite), Assign roles, Resend, Restore, Cancel. Data: members, role chips, invite status. M+D: mobile card list, invite/assign as sheets. **Not in POC** (single implicit user).
- **`ProfilePreferences.dc.html`** — *Profile & preferences — each person's own account* (`8.8 · everyone`). Data: avatar (take photo / choose from gallery), name (Priya Nair), **language preference that re-renders the app**, units. Note: "only your view changes; numbers and ₹ stay Indian." M+D: mobile first-class for field users, back-‹, no bottom nav; desktop sidebar re-renders with language. **Not in POC.**
- **`SetupLater.dc.html`** — onboarding deferral partial: skip company logo / GST / invite-team now (PNG/JPG max 5 MB ≥300px, GSTIN "as on your GST certificate", +91 phone). Replace/Remove logo controls. **Not in POC.**
- **`PropFormStep.dc.html`** / **`PropMetricStep.dc.html`** — reusable **proposal-builder step components**. FormStep: bank-details toggle ("saved but not printed"), logo change, 5 MB file-size validation error. MetricStep: **AI auto-fill**, "Reset to AI values", "Reset to system default", "Save as template", add-step, PDF-length control, optional T&C (≤3 pages). **Not in POC** (no builder, no AI fill).
- **`PropVersionView.dc.html`** — version-comparison component: "This proposal was accepted" locked state, "Nothing to compare yet," Create version 3; "customer keeps seeing v1 until a v2 exists." **Not in POC.**

---

## REPORTS / DASHBOARDS cluster (all `HelioGrid · reports`)

- **`OwnerDashboard.dc.html`** — *Owner dashboard — the honest view*. Sections (overlines): What needs you · Cash this month · Pipeline open (by stage) · Won this period (signed) · Win/loss (closed) · Forecast · Team (pipeline & conversion) · Voice agent · Pushed-to-you in-app monthly summary. Interactions: every card **links straight to the lead/proposal/project**; "Set a monthly target" (optional). Honesty rules baked in ("linked to pipeline — not credited with revenue"). Empty state teaches ("nothing to show yet… here's what will appear and why"). **Not in POC.**
- **`RepDashboard.dc.html`** — *My dashboard — how am I doing*. Sections: Due today · Overdue · Follow-up load · Leads so far · My pipeline (open by stage) · My proposals (out→opened→accepted) · My win rate · Won this period. "Set my target." Explicitly **descriptive, not a leaderboard**; "counts closed deals, not leads marked interested." **Not in POC.**
- **`PipelineFunnel.dc.html`** — *Pipeline funnel & win/loss*. Sections: Funnel (count · value · conversion, this period) · Biggest leak · Time-in-stage avg days · Win/loss reasons by count & value · **Lost late (after quote)** vs **Disqualified early (before quote)**. Links: "See stuck deals," "Owner dashboard." Empty state until deals close. **Not in POC.**
- **`NotificationsCentre.dc.html`** — *Notifications centre*. Layout: panel from the bell (desktop, sidebar visible); mobile full screen with back. Data grouped by day; types = proposal opened, payment due, **agent escalation ("needs you now")**. Controls: Mark all read / Mark read / Snooze / Open / Open call result. Empty = "you're all caught up." **Not in POC.**

---

## CRM / FIELD-APP cluster (`HelioGrid · field app`, mobile-primary with arc nav)

- **`MyDay.dc.html`** — *My Day — the sales rep's home screen*. The signature mobile screen. Layout: date header + avatar; sections **Overdue · N (danger)**, **Today · N**, **Voice agent · overnight** (distinct violet "agent" container — "3 calls made automatically for you"), Recent activity, Upcoming this week. Each lead card: initials/time circle, name · city, task, `size · ₹value` (mono/tabular), inline **Call** + **WhatsApp** buttons. States: normal / empty ("nothing assigned yet — your manager assigns leads") / all-done ("you're all caught up… pull a follow-up forward"). M+D: mobile 375 with arc nav; desktop 1440 variant. **Not in POC** (no CRM, no agent).
- **`QuickAddLead.dc.html`** — *Quick add lead — capture in 30 seconds*. The arc-nav centre action. Controls: Residential / Commercial toggle, minimal fields ("only a phone number? Save now — the rest shows as gaps on the lead"), **duplicate detection** (Open existing lead / Create anyway / Log this as a new enquiry). **Not in POC.**
- **`RoleFlow.dc.html`** — interactive **role-based home-screen demo** (multi-role): My Day variants, agent activity overnight, Overdue/Upcoming; Restart demo / Skip controls. Prototype wrapper, single viewport. **Not in POC.**

*(Leads / LeadDetail / GlobalSearch live alphabetically before this set but are referenced by these screens.)*

---

## SURVEY cluster (remote + physical; `site survey` / `physical survey`)

- **`SurveyMode.dc.html`** — *Survey a roof — remotely, or on site* (`Stage 4`). Layout: choose **Remote survey (now)** vs **Book a physical visit**; "when to use which" guidance; address gate ("this lead doesn't have a usable address yet" → Drop a pin / Correct). Physical path assigns a surveyor + message; "visit booked… on the lead and in the surveyor's day." **A revisit is a new version — v1 kept, never overwritten.** Desktop: sidebar persists, survey fills content; "Proposal builder goes here" handoff. **Not in POC** (POC jumps straight to design).
- **`SurveyorVisits.dc.html`** — *My visits today* (`surveyor · 5.6`). Surveyor home: ordered visit list (address, time, distance), Call / Navigate (hand off to phone) / View survey / Start survey. States: none assigned / "that's everything for today (5 captured & submitted)." M+D: mobile arc nav with **centre = "Start survey"** (role-adapted); desktop list + side panel. **Not in POC.**
- **`ShadingCapture.dc.html`** — *Shading & obstructions* (`physical survey · 5.8`). Layout: sketch left, obstruction list & editor beside (desktop). Add tall objects (water tank, mumty, neighbour's wall, tree) by eye; **explicitly labeled "estimate," never derived from a photo** (honesty rule D35). **Overlaps POC obstructions but as a human-entered survey capture, not the 3D studio tool.**
- **`SurveyReview.dc.html`** — *Review & submit* (`physical survey · 5.9`). Group-by-group captured checklist + submit summary; **Flagged-for-designer** items (e.g., "Meter photo missing" → Fix — back to Electrical). Rule: **submitting with a gap is allowed — it's carried forward to the designer.** **Not in POC.**

---

## PROPOSAL BUILDER cluster (`HelioGrid · proposal builder` — an 11-step guided flow)

- **`ProposalEntry.dc.html`** — *Create a proposal — entry & the 11-step shell*. Two entry paths: **From your design (v1)** vs **Duplicate from a past proposal** ("most repeat residential jobs start here") vs enter-manually ("faster, but generation/savings stay estimates until a survey confirms"). "Find the customer" ("Who is this for?" only appears when started from the Proposals list). Shows the full 11-step rail; draft resumable from the lead. Desktop: sidebar + builder + context panel; live payable (₹4,52,471). **Not in POC** (POC's `/proposal` is a single page, not a guided 11-step builder).
- **`ProposalFormSteps.dc.html`** — *The four form steps — 1 · 2 · 10 · 11* (customer, proposal type incl. per-unit/PPA billing, review, generate). Skip-this-step affordance. **Not in POC.**
- **`ProposalFormSteps2.dc.html`** — *The four data steps — 4 · 5 · 6 · 9*. **Not in POC.**
- **`ProposalStep3.dc.html`** — *Solar system setup* (step 3). Inputs left, **payable pinned right** (desktop); mobile cards, "client-pays collapses to a bar." Includes Battery backup add/edit/remove, category & service, location, pricing & subsidies. **Overlaps POC system-sizing but as a form step, not the studio.**
- **`ProposalStep7.dc.html`** — *Payment terms* (step 7). **Editable tranche table** (milestone · allocation · customer-pays), progress bar; "change step 3 and every ₹ recalculates"; **"these become the project's collection schedule after Won."** Desktop inline-editing table; mobile sticky progress + stacked rows. **Not in POC** (POC has finance libs but no tranche-schedule UI feeding project collection).
- **`ProposalStep8.dc.html`** — *Components* (step 8). Two-column category cards; **Add from catalog**, edit panel/side-sheet; "the gate" + "how they fill." Desktop side panel, mobile bottom sheet. **Overlaps POC BOM/catalog but redesigned with progressive disclosure** (audit flagged "~286 controls at once").
- **`ProposalPreview.dc.html`** — *Proposal preview — what the customer sees*. Thumbnail page rail + continuous scroll + controls (desktop); one-page swipe + pinch-zoom (mobile). **Blocking validation**: "Fix 2 issues to share." Honesty: "no design → shows indicative-proposal line"; "numbers from a real shading simulation — no estimate label needed." **Partially in POC** (`/proposal` renders a doc) but not the gated multi-page preview.
- **`PropDocPage.dc.html`** — the **customer-facing rendered proposal page** component: Suryodaya Solar header, ₹3,51,847 hero, **Monthly generation kWh chart**, Payment schedule, Bank details, T&C ("prices valid 15 days, subsidy subject to DISCOM approval, net-metering depends on utility"). **Partially in POC.**
- **`ProposalShare.dc.html`** — *Share & track*. Send-yourself panel (**Copy link + Download PDF**, suggested message, Call) left; **tracking timeline** right (D32: "we can't see your WhatsApp — tell us once sent; that starts the clock and creates a follow-up in 2 days"; the link is ours so **opens are tracked**). **Partially in POC** (`/share/[shareId]` exists) but no tracking timeline / follow-up automation.
- **`ProposalVersions.dc.html`** — *Proposal versions — the list & the comparison*. List left, **column-diff comparison** right; "Make a new version" opens builder at step 1 pre-filled; accepted version locked ("editing won't change what she agreed to — we'll create a new version"). **Not in POC.**
- **`Proposals.dc.html`** — *Proposals — every quote, and where it stands*. **Sortable table** (status · version · last activity), Sort & Period filters, empty/no-match states; row actions Share / Duplicate / Delete draft. Desktop sidebar + table; mobile reached from `More`, arc nav present. Start from a lead or duplicate. **Not in POC** (no proposals index/list).

---

## PROJECTS (post-Won, light PM) cluster — **`Project Flow.dc.html`** (294 KB, the largest file)

*Mark won — a won deal is a project.* A multi-frame journey covering the whole `projects` domain:
- **Projects board** — every won deal by stage (Won → Material ordered → Dispatch → Installation → Commissioning → Handover); **days-in-stage is the metric** ("installed but stuck a month is not nearly finished"); filters Board / Aged-stuck / Money owed. Cards show kWp · city · ₹value · stage chip · "Waiting on DISCOM" flag · **% collected bar**.
- **Project detail** — "the screen ops lives in": stage, activity timeline, carried-over deal context.
- **Payments** — collect against the **tranches** from proposal step 7 (Record/Save payment, Collected vs Final value).
- **Blockers** — *why it's stuck, and who's waiting* (Set/Clear blocker, reason, "explained delay tolerable — hidden one becomes a complaint"); Confirm & advance / Move stage.
- **Document checklist** — collected / missing / verified (Upload, Mark received, Verify).
- **Handover** — Download pack (incl. one-page customer generation guide), Reopen, **Ask for a referral** ("while the roof is new… best time to ask").
- States: project created / closed / cancelled / no-live-projects.
M+D: mobile field cards + desktop full board. **Entirely not in POC** (POC `/projects` is a stub).

---

## STUDIO-REDESIGN cluster (these **exist in the POC** as studio steps; the specs are the **mobile-parity redesigns** the audit demands — D2/D23)

- **`RoofSetup.dc.html`** (125 KB) — studio steps for roof tracing. State tabs: Empty / Drawing / Roof selected / **AI-detected roofs** (Detect(AI), Review/Dismiss, shared-walls auto-skipped) / Height & parapet / **Calibrate scale** (enter real distance to rescale geometry) / Dependent-items ("reshaping leaves 12 panels + 2 obstructions outside — choose what happens") / 3D preview. Vertex coordinates typeable (local metres from origin), per-edge setbacks, rotate snap-15°, undo point, exit 3D. **In POC (desktop); redesign adds touch model + AI detect + calibration UX.**
- **`Obstructions.dc.html`** (89 KB) — *Step 3 · Obstructions*. Add rooftop objects that shade/block panels (roofs below stay locked); pick type → drops at default size → adjust on canvas; Coarse/Fine, Snap-15°, per-shape size fields, height info, bridging. **In POC; redesign adds mobile canvas editing.**
- **`PanelLayout.dc.html`** — *Steps 5–6 · Panel layout*. Manual place **or auto-fill to step-4 target / roof max**; string colour key; **"Why this layout?"** explainer; Clear-all (undoable, removes panels+strings+cables); 3D toggle. **In POC; redesign adds explanation + mobile.**
- **`ProjectSetup.dc.html`** — *Project setup · Steps 1/10*. Pin the building (search / coordinates / drop pin), **"Move pin >25 m?" → keep vs move-&-clear-design** guard, **Google Solar site intelligence** ("no imagery → continue in manual mode"), branding & type (logo PNG/JPG ≤5 MB on proposal), jurisdiction & tariff, system basics; residential + **C&I / open-access** ("rooftop for now"); survey pre-fills address/tariff/details. **In POC (wizard step 1) — redesign hardens the move-pin/data-loss guard.**
- **`StudioPlaceholder.dc.html`** — explicit **deferred placeholder**: "The design studio isn't built yet — Phase 10 · deferred (D23)," back-to-notifications. (Confirms studio redesign is intentionally last.)

---

## ONBOARDING cluster (company + user; thin device-frame wrappers embedding interactive flows)

- **`SignUp.dc.html`** / **`SignUpFlow.dc.html`** — *Create your account* (`Company onboarding`). **Phone-number-first, no password** ("we'll text a code"); already-registered path ("this number already has an account → Sign in instead / Use a different number"). GSTIN/logo/address/team deliberately deferred. Both viewports fully interactive; Restart demo. **Not in POC** (POC `/login` is minimal).
- **`WhatYouSell.dc.html`** / **`SellFlow.dc.html`** — *What do you install?* (`Step 1 of 2`). Residential rooftop (Homes 1–15 kW) / Commercial & industrial (Factories 20 kW+) / Both; typical system size (optional); Continue / Skip. **Not in POC.**
- **`YourRole.dc.html`** — *Your role, explained* (`User onboarding`). Desktop **multi-role** vs mobile **single role** framing. **Not in POC.**
- **`YoureReady.dc.html`** / **`ReadyFlow.dc.html`** — *You're ready* (`Company onboarding`) / "You're set up, Rajesh — where to start?": **Add your first lead** / **Explore a demo project** / Start selling. **Not in POC.**

*(Frame conventions: SignUp/WhatYouSell/YourRole/YoureReady render "375 px / 1440 px" cover frames; the `*Flow` files are the clickable single-viewport prototypes with Restart-demo controls.)*

---

## CROSS-CUTTING PATTERNS

1. **Dual-frame, mobile-first parity (D2).** Every full screen ships `Mobile · 375` + `Desktop · 1440`. Consistent responsive grammar: desktop keeps the **left sidebar** and puts secondary content in a **beside-panel / pinned rail**; mobile collapses editors into **bottom sheets**, uses **back-‹**, and drops the bottom nav on nested/settings screens.
2. **The arc-nav mobile shell** (spec'd in `product-journey.md`): 5-slot shallow-arc bar, elevated brass centre = **role-adaptive quick action** (rep→Add lead, surveyor→Start survey), never hides on scroll, rectangular 44px hit areas, labels always visible. Referenced by MyDay/Proposals/SurveyorVisits.
3. **Honesty / provenance is a first-class UI concern** (matches POC's CLAUDE.md rules): estimate-vs-measured labels (ShadingCapture, ProposalPreview), **stale-money must visibly say so**, "no discount approval but arithmetic guard blocks ₹0" (D34), accepted-version locking, "linked to pipeline, not credited revenue."
4. **Teaching empty states everywhere** — every list explains what goes here, why it matters, and one action (OwnerDashboard, RepDashboard, Proposals, MyDay, Notifications, SurveyorVisits).
5. **Multilingual (English/Hindi/Marathi) as a design-system concern**, not a translation task — templates in 3 languages, per-user language re-renders the app, ₹/number formatting stays Indian.
6. **Voice agent woven through the product**, not a settings toggle — overnight-call panel on My Day, agent escalations in Notifications, agent columns on dashboards; **fully tenant-configurable** (D36).
7. **One proposal object** (not quote+proposal) that is **versioned, shared via tokenised link, tracked, and its tranches become the project's collection schedule** — a continuous CRM→survey→design→proposal→project→payments→handover→referral spine.
8. **Seeded, realistic, stateful mockups** — same personas/IDs across files, explicit state-tab strips, giving a build team exact data contracts and edge states.

## NOTABLE GAPS (flows implied across files but not covered by any single file in this set)

- **Leads / LeadDetail / GlobalSearch / QualifyAssign** — heavily referenced (My Day cards, "start from a lead," manager assignment, one-field search) but those screen files sort **before** MessageTemplates (first half); the lead lifecycle itself isn't in this second-half slice.
- **Voice-agent configuration & performance screens** — `product-journey.md` specs "Agent performance," agent knowledge/config, calling-rules defaults, escalation rules; **no `.dc.html` in this range renders them** (AgentSetup/AgentPerformance/AgentQueue/etc. are first-half files).
- **Engineer sign-off queue / design-return-with-comments / design-variants-side-by-side** — called out in Stage 5 as *new screens the design stage needs* but **no mockup exists** for them here.
- **Billing & subscription** — Settings row `8.7` points to it and Notifications shows "payment due," but **no billing screen** appears in this slice (BillingDoc/Billing are first-half).
- **The "phantom Step 5"** and **unified header system** — audit-flagged studio problems (three header systems, no loading states) that the redesign files (RoofSetup/PanelLayout/etc.) address piecemeal but no file defines the consolidated shell.
- **Offline capture** — spec says survey capture is fully offline with sync indicators; **no screen depicts the offline/sync state**.
- **C&I-specific commitment/authority** — D33 flags the single-link risk (₹92 lakh order accepted by anyone with the link, no per-contact identity); **no screen handles named links / OTP-on-accept**.
- **Customer-side surface (C1–C13)** — the whole "other side of the glass" (enquiry, wait, proposal-open, decision, advance payment, long install wait, commissioning, handover) is specified in the master doc; only the **customer-facing proposal doc** (`PropDocPage`) and share link exist as mockups here — the rest of the customer journey has no screen file.

For architecture: treat the **Solar Studio (POC)** as the single existing, test-covered engine to wrap and mobilise; **everything in this catalogue outside the studio-redesign cluster is greenfield** and must be built multi-tenant with per-tenant configurability of agent, catalog/pricebook, proposal defaults, roles, calling rules, and language.