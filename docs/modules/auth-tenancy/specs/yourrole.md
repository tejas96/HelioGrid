# YourRole — implementation spec (UX-master lens, auth module)

Sources studied in full:
- `design/mockups/YourRole.dc.html` (canvas wrapper: 375px mobile frame + 1440px desktop frame)
- `design/mockups/RoleFlow.dc.html` (the actual component with all interaction states, 463 lines incl. logic script)

The canvas embeds `RoleFlow` twice: `variant="mobile" role-mode="rep"` inside an iPhone
frame (375×812, content area 375×766 under a 46px status bar) and `variant="desktop"
role-mode="rep-surveyor"` inside a browser frame (1440×900, content area 1440×852 under a
48px chrome bar showing `app.heliogrid.in`). Status bar / browser chrome are mockup
furniture, not product.

---

## 1. PURPOSE + place in the auth journey

A one-shot **role explainer** shown to a newly onboarded team member immediately after
authentication completes and before they land in the app. Design intent stated verbatim on
the canvas:

> "One screen, three lines, one button — never a carousel. Mobile shows the single-role
> (Sales Rep) version; desktop shows the multi-role (Sales Rep + Surveyor) version. The
> demo link flips each between the two. 'Got it' lands on the real My Day screen, where at
> most three dismissible coach marks appear — not a tour."

Journey position: **Invite accepted → OTP login (LoginFlow) → YourRole → My Day (with ≤3
coach marks) → normal app**. It is the terminal onboarding step for invited members (the
owner path goes through WhatYouSell / TeamRoles / YoureReady instead). The screen adapts
to the user's assigned role set — the mockup models two: `rep` (single role) and
`rep-surveyor` (two roles). Content is generated from the roles the inviter assigned
(D27/D28 preset roles), never chosen here — there is **no input on this screen**.

Two macro-steps live in RoleFlow's state machine (`step: 'role' | 'app'`):
1. **Role explainer** — logo, role icon, title, role chips, (multi-only) intro line, three
   checkmarked lines, one primary button.
2. **App landing + coach marks** — a rendering of My Day (mobile and desktop variants)
   with a 3-step dismissible coach-mark overlay. The My Day content itself is spec'd by
   `MyDay.dc.html`; what THIS spec owns is the **coach-mark overlay contract** layered on
   top of it (targets, copy, dismiss/skip semantics, spotlight styling).

Demo-only affordances (do NOT implement): the "Demo — see the …-role version" toggle
footer, and the "Restart demo" button after coach marks finish.

---

## 2. LAYOUT

### 2.1 Role explainer — mobile (375, density: expressive)

- Full-bleed `--canvas` background, `overflow:hidden`.
- **Bloom layer** (only while `step === 'role'`): a `--glow-brand` radial, 520×520px,
  centred horizontally, top −150px (bleeds off the top edge), `pointer-events:none`,
  ambient animation `hg-bloom` 8s infinite (scale 1→1.09, opacity .85→1), fully disabled
  under `prefers-reduced-motion`.
- Content column: vertically centred (`justify-content: safe center`), horizontal padding
  26px, vertical padding 20px, `max-width: 620px` (irrelevant at 375 — column is fluid).
- Vertical rhythm inside the column (top → bottom):
  - Wordmark row: "Helio**Grid**" 22px/700/−0.02em, "Grid" filled with
    `--gradient-brand` via background-clip text. `margin-bottom: 30px`.
  - Role icon circle: 56px circle, `--accent-subtle` fill, `--accent` icon (user icon
    28px, stroke 1.5).
  - `h1` role title: 30px / 700 / −0.025em / line-height 1.12, `margin-top: 20px`.
  - Role chips row: `margin-top: 12px`, wrap, gap 8px. Each chip: 30px tall pill
    (r 999), padding 0 14px, `--accent-subtle` bg, `--accent` text, 13px/500.
  - (multi-role only) intro paragraph: `margin-top: 14px`, 15px/1.5, `--text-secondary`.
  - Three-line list: `margin-top: 24px`, column gap 16px. Each line = 30px check circle
    (`--accent-subtle` bg, `--accent` check icon 16px stroke 2, `margin-top:1px`) +
    13px gap + text 15.5px/1.45 `--text-primary` (`padding-top:4px`, `text-wrap:pretty`).
  - Primary button: `margin-top: 28px`, full width, lg (48px).
  - Demo footer (demo only): `margin-top: 20px`, centred, 12px `--text-tertiary`.
- Entry motion: whole block animates `hg-rise` — fade + rise 8px, 320ms `--ease-enter`
  (matches DS "emphasised" 320ms mount).

### 2.2 Role explainer — desktop (1440)

Identical stack, but: column `max-width: 400px` (a deliberately narrow, centred, focused
column — NOT a two-column layout), horizontal padding 56px, vertical padding 0, bloom
860×860 at top −180. Same type sizes — the explainer does not scale up on desktop.

### 2.3 App landing + coach marks — mobile (expressive density)

(Owned by the MyDay spec for content; summarized here because the coach marks anchor to it.)
- Header row: padding 22px 20px 12px. Left: "My Day" 22px/700 + date 13px
  `--text-secondary`. Right: **role chip** — 34px pill, `--surface` bg + `--e1`,
  13px/500 `--text-secondary` label + 26px avatar circle ("A", `--accent-subtle`/
  `--accent`, 12px/700). This chip is coach target 3.
- Scrollable body: padding 6px 16px 16px; cards `--surface`, radius 14–16, `--e1`,
  stacked with 12px gaps. Sections: Overdue (danger overline) → Today rows → Agent
  activity card → Upcoming this week card. The Overdue+Today block is coach target 1.
- Bottom arc nav: 96px tall region, white arc path (`M0,34 Q187.5,-8 375,34…`) with
  `drop-shadow(0 -3px 10px rgba(10,10,11,0.07))`; items at 12% / 31% / 69% / 88%
  (My Day active in `--accent`, others `--text-tertiary`, 24px icons + 12px labels);
  centre FAB raised (top −16px) with "Add lead" label 12px/500. FAB is coach target 2.
- Coach overlay: full-screen scrim `rgba(255,255,255,0.55)` + `backdrop-filter: blur(2px)`
  at z-20; the current target is lifted to z-30 with a `0 0 0 3px var(--accent)` ring
  (FAB variant: `--e4, 0 0 0 3px var(--surface), 0 0 0 5px var(--accent)` — a white gap
  halo); the coach card floats at z-40, `left:16px; right:16px; bottom:96px` (above the
  nav), radius 18, `--e5`, padding 16px 18px, mounting with `hg-pop` 240ms
  `--ease-spring` (fade + rise 10px + scale 0.98→1).
- Coach card anatomy: header row = overline "1 of 3" (11px/700/0.12em/uppercase,
  `--accent`) + dismiss X icon button (16px, `--text-tertiary`, `aria-label="Dismiss"`);
  body text 14.5px/1.45 `--text-primary`, `margin-top:8px`; footer row `margin-top:14px`
  = "Skip" text button (13.5px/500 `--text-secondary`) left, primary sm button right.

### 2.4 App landing + coach marks — desktop (functional density)

- **Collapsible rail** (default collapsed): 72px collapsed / 220px open, `--surface` +
  `--e1`, width transition 240ms `--ease-standard`. Top: 38px "H" logo square
  (r 11, `--gradient-brand`, white 17px/700) which toggles the rail; open state adds the
  wordmark + a collapse chevrons button (30px). Nav rows: 44px tall (44×44 icon-only when
  collapsed, `title` tooltips), radius 12/13, `--text-secondary`, hover `--neutral-bg`
  (140ms); active row `--accent-subtle` bg + `--accent`; open state shows labels 14px +
  right-aligned mono counts 12px `--text-tertiary` (Leads 24 · Site visits 3 ·
  Proposals 2). Bottom group: Notifications (8px `--danger` dot ringed by 2px
  `--surface`; count 3), Settings, then profile row (38px avatar "A", name 13.5px/500,
  role line 12px `--text-secondary`) — the profile row is coach target 3.
- Top bar: 64px, padding 0 28px: search pill (max 440px, 42px tall, `--surface` + `--e1`,
  placeholder 14px `--text-tertiary`) · spacer · date 13px · "Add lead" primary md button
  (coach target 2).
- Content: two columns `flex: 3 / flex: 2`, gap 18px, padding 6px 24px 24px.
  - Left: greeting card (radius 18, `--e1`, padding 20 22, with a 240px `--glow-brand`
    bloom clipped in the top-right corner) then the leads card (Overdue · 2 + Today rows;
    coach target 1). Row anatomy: 34px initials avatar · name 14px/500 + place 12.5px
    secondary · meta 12px `--text-tertiary` right-aligned 110px · stage chip 24px pill ·
    value in `--font-mono` 13px/500 tabular right-aligned 96px · two 32px round icon
    buttons (Call, WhatsApp) on `--neutral-bg`. Rows: padding 10 12, radius 12, hover
    `--neutral-bg` 140ms, clickable.
  - Right: default = Agent activity card + Upcoming this week card; when a row is
    selected = lead detail card (radius 16, `--e2`): header (avatar, name 16px/700,
    place, close X), label/value rows (Phone / System size / Value / Stage — values in
    mono, stage as accent chip), "Recent activity" overline + two lines, footer buttons
    "Call" (secondary md) + "Create proposal" (primary md) pinned to bottom.
- Coach overlay: same scrim; coach card is centred, `width: 380px`, `bottom: 32px`.

---

## 3. EXACT COPY

Every string, verbatim. `(dyn)` = varies with data/role-set; `(demo)` = mockup-only.

### Role explainer

| String | Notes |
|---|---|
| `HelioGrid` | wordmark, "Grid" gradient-clipped |
| `You're a Sales Rep` | h1, single-role (dyn: role name) |
| `You're a Sales Rep and Surveyor` | h1, multi-role (dyn: role names) |
| `Sales rep` | chip (dyn) |
| `Surveyor` | chip, multi only (dyn) |
| `You hold two roles, so you can do both jobs in one app.` | intro, multi only |
| `You'll see the leads assigned to you` | line 1, single |
| `You can create designs and send proposals` | line 2, single |
| `You'll see the leads assigned to you, plus your site visits for the day` | line 1, multi |
| `You can capture surveys, create designs, and send proposals` | line 2, multi |
| `Your owner approves discounts` | line 3, both role-sets |
| `Got it` | primary button |
| `Demo — ` / `see the single-role version` / `see the both-roles version` | (demo) footer toggle |

### Coach marks

| String | Notes |
|---|---|
| `1 of 3` / `2 of 3` / `3 of 3` | overline (dyn: `${coach+1} of 3`) |
| `Your leads live here — only the ones assigned to you.` | step 1, single-role |
| `Your leads and today's site visits both live here — only what's assigned to you.` | step 1, multi-role |
| `Start here to create designs and send proposals on WhatsApp.` | step 2, single-role |
| `Start here to capture a survey, build a proposal, and send it on WhatsApp.` | step 2, multi-role |
| `Discounts are the one thing your owner approves — you'll get a nudge when one's needed.` | step 3, both role-sets |
| `Skip` | text button |
| `Next` | primary sm, steps 1–2 |
| `Got it` | primary sm, step 3 |
| `Dismiss` | aria-label on the X icon button |
| `Restart demo` | (demo) |

### My Day landing content (sample data — all `(dyn)`; canonical copy belongs to the MyDay spec)

Header: `My Day` · `Tuesday, 21 Jul` · role chip `Sales rep` / `Rep · Surveyor` · avatar `A`.
Overlines: `Overdue · 1` (mobile) / `Overdue · 2` (desktop) · `Today` / `Today · visits & calls`
(multi) · `Agent activity · overnight` (mobile) / `Agent activity` (desktop) ·
`Upcoming this week` · `Recent activity`.
Leads: `Priya Sharma` (`PS`, Nashik, `Follow-up 3 days late · 8.2 kWp · ₹4,52,000` mobile;
`Follow-up 3d late`, `₹4,52,000`, `8.2 kWp`, `+91 98220 11234`, stage `Proposal sent`,
overdue) · `Anand Traders` (`AT`, Pune, `Unopened · 5d`, `180 kWp`, `₹92,00,000`,
`+91 98230 55677`, `Proposal sent`, overdue) · `Suresh Kulkarni` (`SK`, Kothrud,
`10:00 · Site visit`, `6 kWp`, `₹3,40,000`, `+91 90280 44521`, `Survey scheduled`) ·
`Rohit Mehta` (`RM`, Aundh, `14:00 · Callback`, `10 kWp`, `₹5,60,000`, `+91 91300 77820`,
`Qualified`) · `Vikram Deshpande` (`VD`, Baner, `16:30 · Follow-up`, `5 kWp`, `₹2,90,000`,
`+91 99700 12045`, `New lead`).
Mobile Today rows: `Site visit` / `Kothrud, Pune` (avatar `10:00`) · `Call back Mehta` /
`Asked about subsidy` (avatar `14:00`).
Agent activity: `Rakesh Patil` / `Interested · callback Thu 4pm` · `Sunita D.` /
`No answer · retry tomorrow` · `Vinod K.` / `Asked about warranty · answered`.
Upcoming: `Follow-ups` 8 · `Site visits` 3 · `Proposals to send` 2.
Desktop greeting: `Good morning, Anita` · `2 overdue · 5 to do today · your voice agent
made 3 calls overnight`. Chip labels: `Overdue` (danger) or the stage name (accent).
Detail card labels: `Phone` · `System size` · `Value` · `Stage` · `Proposal sent · 3 days
ago` · `Site visit done · 6 days ago` · buttons `Call` · `Create proposal`.
Desktop chrome: search placeholder `Search leads, customers, sites` · rail items `My Day`,
`Leads`, `Site visits`, `Proposals`, `Projects`, `Notifications`, `Settings` · profile
`Anita Rao`. Mobile nav labels: `My Day` · `Leads` · `Projects` · `More` · `Add lead`.
Copy language: **English only** — no Hindi/Marathi variants in either mockup; all strings
must be Lingui catalog messages (EN/HI/MR).

---

## 4. COMPONENT MAP (21-component `_ds` API)

The mockup itself imports `HelioGridDesignSystem_c8aa43.Button` for every real button —
strong signal the rest is intended as composition.

| Mockup element | `_ds` component | Props | Notes |
|---|---|---|---|
| "Got it" (explainer) | `Button` | `variant="primary" size="lg" fullWidth` | 48px, pill |
| Coach "Next"/"Got it" | `Button` | `variant="primary" size="sm"` | 32px |
| "Add lead" (desktop top bar) | `Button` | `variant="primary" size="md"` | |
| "Call" (detail card) | `Button` | `variant="secondary" size="md"` | |
| "Create proposal" (detail card) | `Button` | `variant="primary" size="md"` | |
| Role icon circle (56px) | `IconCircle` | accent-subtle tint, user icon | **size 56 not in the stated 40/32 set — needs a size prop or approved extension** |
| Check circles (30px), list icon circles (30px) | `IconCircle` | | **30px also off the stated set** |
| Role chips (`Sales rep`, `Surveyor`) | `Chip` | accent-subtle/accent, 30px pill | clean map |
| Row stage chips (`Overdue`, `Proposal sent`, `Survey scheduled`, `Qualified`, `New lead`) | `StatusChip` | | **label-set mismatch — see CONFLICTS** |
| Initials circles (PS/AT/…, `A`) | `Avatar` | 34px rows, 26px chip, 38px rail | initials variant; danger-toned avatar for overdue rows is a tint variant to verify |
| Lead rows / upcoming rows / agent rows | `ListRow` | leading avatar/icon, title, subtitle, trailing | desktop lead row (meta + chip + value + 2 icon buttons) is a **wide composition** on ListRow |
| Call / WhatsApp round buttons (32px) | `IconButton` | ghost on `--neutral-bg` | 32px < 44 target — desktop-pointer only |
| Dismiss X, close X, rail collapse | `IconButton` | ghost | |
| All cards (explainer none; My Day cards, coach card, greeting card, detail card) | `Card` | `--e1`/`--e2`/`--e5` | radii 14/16/18 — see CONFLICTS |
| Notifications dot | `Badge` | dot variant on icon | |
| Rail counts (24/3/2) | `Badge`/text | mono 12px | |
| Coach mark card | **composition** | Card + overline + IconButton + text-button + Button sm | not a `_ds` primitive; build once as an onboarding-local composite |
| Spotlight ring on target | **composition** | `0 0 0 3px var(--accent)` ring, 200ms | plus FAB white-gap halo variant |
| Scrim | **composition** | white 0.55 + blur 2px | see CONFLICTS vs DS overlay law |
| Bloom layer | **composition** | `--glow-brand`, ambient 8s | same pattern EmptyState already uses |
| Wordmark w/ gradient clip | **composition** | shared with Login/SignUp screens | |
| Arc bottom nav + FAB | app-shell pattern | | owned by mobile app shell, not this screen |
| Collapsible rail, search pill, top bar | app-shell pattern | | rail widths conflict — below |
| Segmented/Tabs/Input/Checkbox/Radio/Switch/Toast/EmptyState/ProgressBar/OfflineBanner/StatCard/AvatarGroup | — | | not used on this surface |

### CONFLICTS (mockup vs ds-source/docs/10 — resolve before build)

1. **FAB fill is `--accent` (C-1, severity high).** `addCircleStyle` = 50px circle,
   `background: var(--accent)`, icon `color: var(--action-primary)`. docs/10 is explicit:
   the centre FAB is **near-black `--action-primary`, 54px, `--e4`**, and accent is
   "never a button fill". The mockup violates both fill and size. Build per docs/10
   (near-black 54px); treat mockup as a bug like the documented "danger" variant bug.
2. **Rail widths 220/72** vs layout tokens **sidebar 260 / collapsed 68**. Follow tokens
   unless the owner re-rules; the mockup's collapse interaction (logo toggles, 240ms) is
   good and keepable.
3. **Bottom nav region 96px** (arc apex) vs token **bottom-nav 72**. Likely 72 bar + arc
   overshoot; confirm against the app-shell implementation.
4. **Coach scrim `rgba(255,255,255,0.55)` + `blur(2px)`** vs DS overlay law "blur 0→8px,
   fade toward white 0.35". Either adopt the DS values or get the lighter coach-specific
   scrim sanctioned as a named exception.
5. **Off-scale font sizes**: 15.5 / 14.5 / 13.5 / 12.5 px appear throughout. DS scale has
   15 / 13 / 12. Snap to tokens (15.5→15, 14.5→15 or 13, 13.5→13, 12.5→13 or 12).
6. **Off-scale radii**: cards at 14 / 16 / 18 px; DS says 24 expressive / 12 functional.
   Coach card 18 → nearest sanctioned value must be chosen (12 functional or 24
   expressive).
7. **Off-scale circle sizes** 26 / 30 / 34 / 38 / 50 / 56 for IconCircle/Avatar; only 40/32
   are documented for IconCircle. Needs a sanctioned size ramp or generation-time tokens.
8. **StatusChip label mismatch**: mockup uses lead-stage labels (`New lead`, `Qualified`,
   `Proposal sent`) + `Overdue`; docs/10 enumerates lead / survey-scheduled /
   design-in-progress / approved / installing / commissioned / on-hold. The StatusChip
   domain map must be extended (or these are Chip, not StatusChip) — needs a ruling.
9. **Meaning-bearing overlines in `--text-tertiary`** (`Today`, `Agent activity`,
   `Upcoming this week`, coach-unrelated): docs/10 says tertiary (~2.5:1) is decorative
   only; meaning-bearing overlines use `--text-secondary`. `Overdue · n` in `--danger`
   is semantic and reasonable but is also below AA as bare text — verify.
10. **Provenance missing** on ₹ values and kWp figures in the landing content (product
    law: every user-visible number carries a tier). Owned by the MyDay spec but the coach
    overlay renders on top of it — do not ship the landing without tiers.
11. **32px icon buttons** (Call/WhatsApp) and 16–18px dismiss/close hit areas are below
    the 44px target floor. Desktop-pointer context mitigates; RN/mobile must not copy
    these sizes.
12. `rgba(10,10,11,0.07)` drop-shadow on the arc and `rgba(255,255,255,0.55)` scrim are
    raw values not in the token set (elevation tokens exist for shadows).

---

## 5. STATES & INTERACTIONS

State machine (from the mockup logic): `{ step: 'role'|'app', coach: 0|1|2|3, multi: bool,
selected: leadId|null, railOpen: bool }`. Initial: `step='role', coach=0,
railOpen=false, selected=null`; `multi` derives from the user's assigned roles.

### Step A — Role explainer
- **Static, zero-input.** No validation, no fields, no error states of its own.
- Motion: block mounts with fade+rise 8px, 320ms `--ease-enter`; bloom pulses 8s ambient;
  `prefers-reduced-motion` kills both (mockup sets `animation:none`; DS says collapse to
  1ms).
- Focus order: (skip wordmark) → "Got it" → (demo toggle). "Got it" is the only real
  interactive element; it should receive initial focus or be first in tab order. Enter/
  Space activates.
- `gotIt` → `step='app', coach=0`. Production: also persist "role explainer seen" so it
  never re-shows (see Open Questions on where).
- Loading: the role set arrives with the session — if not yet loaded, hold on the auth
  loading state; never render a wrong role. Error/offline: role data is in the JWT/session
  → screen works offline; if truly unavailable, fall back to app entry without explainer
  rather than blocking (no error UI is designed).

### Step B — Coach marks over My Day (coach 0 → 1 → 2 → 3=done)
- On entry `coach=0` → overlay active immediately (`coachActive = coach < 3`).
- Per step: scrim + blur mounts; target element is elevated above the scrim (z-30) and
  ringed `0 0 0 3px var(--accent)` (transition 200ms `--ease-standard`); coach card
  mounts with `hg-pop` 240ms `--ease-spring` (re-runs per step).
- Targets:
  - **Step 1 (`1 of 3`)**: mobile = the Overdue+Today leads block; desktop = the leads
    card. Copy varies by role-set.
  - **Step 2 (`2 of 3`)**: mobile = the centre FAB (special halo: `--e4, 0 0 0 3px
    var(--surface), 0 0 0 5px var(--accent)`); desktop = the "Add lead" button.
  - **Step 3 (`3 of 3`)**: mobile = the header role chip; desktop = the rail profile row.
- Controls: `Next` → `coach+1`; on step 3 the button reads `Got it` and completes.
  `Skip` and the X (`Dismiss`) both jump straight to done (`coach=3`) — identical
  semantics. Completion removes scrim + ring, app becomes interactive.
- The app behind the scrim is **not interactive** while a coach mark is active (scrim
  intercepts). Coach card is the only focus surface: trap focus within it (X → text →
  Skip → Next), Esc = dismiss (Skip semantics), per DS modal law.
- Persistence: dismissal/completion must be remembered per user (coach marks appear at
  most once — "not a tour"). Re-entry to My Day later shows nothing.
- Timers: **none** on this surface (no OTP/resend here).
- Desktop-only interactions in the landing beneath (out of coach scope, listed for
  completeness): rail toggle 240ms width transition with icon-only tooltips when
  collapsed; row hover `--neutral-bg` 140ms; row click selects a lead → right panel swaps
  from Agent-activity/Upcoming to the detail card; close X returns; Call/WhatsApp icon
  buttons stop propagation (don't select the row).
- Four-state coverage: mockup designs **default only**. Loading/empty/error/offline for
  the landing content are the MyDay spec's obligation; the explainer itself needs none
  beyond the session-loading gate; the coach overlay must handle its target being
  absent (e.g. zero leads → empty state replaces the leads card) — see Open Questions.

---

## 6. NAVIGATION

- **Entry**: automatically, first successful authentication of an invited member (post
  LoginFlow / InviteFlow OTP verification). Never reachable from menus; no revisit
  affordance is designed.
- **Exit**: "Got it" → My Day (`/` app home) with coach marks; coach completion/skip →
  plain My Day. Demo wiring confirms Leads nav: bottom-nav "Leads" and rail "Leads" both
  navigate to the Leads screen (`goLeads` → `Leads.dc.html`).
- **Back behaviour**: nothing designed. There is no back control on the explainer.
  Recommended: Android hardware back on the explainer does nothing (or backgrounds the
  app) — it must not return to OTP/login; browser back should also not resurrect the
  explainer after "Got it" (replace, don't push, the history entry).
- **Deep links**: none defined. The explainer is a gate, not a route — direct URL access
  to app routes by a user who hasn't seen it should (presumably) redirect through it
  once; not specified.
- **Lockstep**: this surface ships web AND React Native in the same slice (Law 7). The
  mobile variant is the RN screen; the desktop variant is web.

---

## 7. ICONS (Lucide best-guess, 1.5px stroke default)

Explainer: `user` (role circle, 28px), `check` (lines, 16px, stroke 2).
Coach: `x` (dismiss, 16px).
Mobile landing/nav: `house` (My Day), `user` / `users` (Leads), `layout-grid` (Projects),
`ellipsis` (More), `plus` (FAB), `bot` (agent rows), `send` (follow-ups), `map-pin`
(site visits), `file-text` (proposals).
Desktop extras: `search`, `chevrons-left` (rail collapse), `users` (Leads), `bell`
(Notifications), `settings`, `phone` (call), `message-circle` (WhatsApp), `x` (close),
`lock` (browser chrome — mockup furniture only).
Status-bar signal/wifi/battery glyphs are frame furniture, not product. All icons must be
bundled locally (no CDN), round caps/joins.

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **Other role-sets.** Only `rep` and `rep-surveyor` are modelled. Copy (title grammar,
   three lines, coach texts) for the other preset roles (Owner, Designer, Installer,
   Accounts — D27's six presets) and for 3+ role combinations is undefined. Does the
   owner see this screen at all, or only the YoureReady flow?
2. **Persistence of "seen".** Where is explainer-seen / coach-done stored — server-side
   per user (survives reinstall, correct for D25-style per-user prefs) or device-local?
   Not specified. Also: does a later role CHANGE re-trigger the explainer?
3. **StatusChip vocabulary** (CONFLICT 8): are `New lead / Qualified / Proposal sent /
   Overdue` sanctioned StatusChip states or ad-hoc chips? Needs a ruling before the
   component API is touched.
4. **FAB colour** (CONFLICT 1): build per docs/10 near-black, but the mockup's accent FAB
   should be flagged to the owner in case it's a deliberate new ruling.
5. **Coach target absence**: with zero leads (a brand-new tenant member's most likely
   state!) the leads block is an EmptyState — what does coach step 1 anchor to? The
   sample data shows a populated day, which a fresh user won't have.
6. **Coach marks and scroll**: mobile step 1's target can scroll; card is pinned above
   the nav. Is the target auto-scrolled into view? Unspecified.
7. **Esc / hardware-back during coach marks**: dismiss (skip) or no-op? Unspecified
   (spec recommends Esc = Skip per modal law).
8. **Hindi/Marathi**: no Devanagari render of the explainer or coach copy exists; the
   30px chips and 15.5px lines must survive ~20–30% expansion — unverified.
9. **Scrim spec** (CONFLICT 4): is the lighter 0.55/2px coach scrim a sanctioned variant
   of the 0.35/8px overlay law?
10. **Desktop `colMax` oddity**: explainer column max is 620 on mobile but 400 on
    desktop — intentional (tighter focus at large sizes) or a mockup accident?
11. **"Restart demo" & role toggle** are demo-only — confirmed by canvas prose — but a
    production "review my role" re-entry point (e.g. from Profile) is nowhere defined.
12. **Multi-role intro line** exists only for multi (`hasIntro: multi`); single-role gets
    no intro. Confirm this asymmetry is intended.
13. **Coach overline colour**: `--accent` for "1 of 3" — docs/10 restricts meaning-bearing
    overlines to `--text-secondary`; accent-as-text for step counters needs a nod.
14. **Provenance** on the landing's ₹/kWp values (CONFLICT 10) — which tier do My Day
    aggregates carry?
