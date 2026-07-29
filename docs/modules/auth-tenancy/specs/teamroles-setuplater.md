# Implementation spec — TeamRoles.dc.html + SetupLater.dc.html

Source mockups (read in full, including their DCLogic scripts):
- `/Volumes/works-space/heliogrid/design/mockups/TeamRoles.dc.html`
- `/Volumes/works-space/heliogrid/design/mockups/SetupLater.dc.html`

Component API ground truth checked against `/Volumes/works-space/heliogrid/packages/ui/src/index.ts`
(the implemented 21-component `_ds` library, gallery-verified 2026-07-26).

---

## 1. PURPOSE + PLACE IN THE AUTH JOURNEY

### TeamRoles ("Settings · 8.6 — Team & roles")
The tenant's team management surface: who is on the team, which of the **six fixed
roles** each person holds, invite-by-phone, role assignment, restore of deactivated
members, and a read-only roles reference. This is the admin end of the auth module's
role model (D27/D28: six preset roles, capability = OR across held roles, lead
visibility = widest held, no per-user permission exceptions). It sits under **Settings**
(back target is `Settings.dc.html`) and is reachable only by holders of the
"Manage team, roles & company settings" capability (Owner, per the mockup's own matrix).
The invite it sends is the entry point of the invitee's auth journey — the recipient
side is `InviteLanding.dc.html` / `InviteFlow.dc.html` (WhatsApp invite → OTP join).

### SetupLater ("Finish setting up later")
A collapsible, embedded checklist **card widget** (not a full screen) shown to a
freshly-signed-up owner who skipped optional onboarding steps. Three deferred tasks:
**company logo**, **GST details**, **invite your team**. It is the post-signup tail of
the auth/tenancy onboarding: it completes tenant profile data (logo → proposals, GSTIN →
GST-compliant proposals) and seeds the same team-invite flow that TeamRoles owns. The
mockup renders the card standalone (preview 375×420, `variant: 'mobile'|'desktop'`);
its host screen is not shown (see Open Questions).

---

## 2. LAYOUT

### 2.1 TeamRoles — Mobile · 375 (expressive density; nested screen, NO bottom nav, back-‹ pattern)

Vertical structure (frame 375×812, canvas `--bg-page` = `--canvas #F6F7F9`):

1. **Top bar** (fixed, padding `20px 16px 12px`, gap 12):
   - Back: 38px circular icon button, `--surface` bg, `--e1`, chevron-left 19px
     (**CONFLICT C1: 38px < 44px target; IconButton size enum is 32|40|48 → use 40**).
   - Title block (flex:1): "Team & roles" 15px/700/−0.02em; below it a 12px
     `--text-secondary` count line.
   - Right: 38px circular icon button, info glyph, opens Roles reference (same C1).
2. **Scrolling card list** (flex:1, padding `4px 16px 96px`, column gap 10):
   one **person card** per member — white `--surface`, radius 18, `--e2`, padding 15
   (**CONFLICT C2: radius 18 not on card scale 24/12**). Card anatomy:
   - Row 1: 40px initials avatar (`--accent-subtle` bg / `--accent` text; deactivated:
     `--neutral-bg` / `--text-tertiary`) · name 14.5/600/−0.01em + status chip inline ·
     meta line 11.5px `--text-tertiary` · trailing chevron-right 18px `--text-tertiary`.
   - Row 2 (margin-top 11): wrapped role chips, gap 6 — 24px-tall pills, 11.5/500;
     Owner chip `--accent-subtle`/`--accent`, all others `--neutral-bg`/`--text-secondary`.
   - Row 3 (deactivated only, margin-top 11, `border-top: 1px solid var(--hairline)` —
     sanctioned hairline): history icon 14px + note 11.5px tertiary + "Restore" pill
     button 30px tall `--neutral-bg` (**CONFLICT C3: 30px height off Button scale and
     sub-44 target**).
   - Whole card is tappable (opens Assign sheet) only when status = active
     (`cursor:pointer`); invited/deactivated cards are inert. Deactivated card renders
     at `opacity: 0.72`.
3. **Sticky bottom bar**: padding `12px 16px`, `--surface` bg, top shadow
   `0 -6px 16px -12px rgba(10,10,11,0.16)` (**CONFLICT C4: raw shadow, not an elevation
   token**). Contains one full-width primary button "Invite someone", 46px tall
   (**CONFLICT C5: 46px is neither lg 48 nor md 40**), user-plus icon 17px leading.

**Mobile sheets** (Assign / Invite / Error, and Roles reference — all identical shell):
- Backdrop: absolute inset-0, `rgba(246,247,249,0.6)` + `backdrop-filter: blur(8px)`,
  fade-in 200ms `--ease-enter`. (Matches the "blur + fade toward white, never dark
  scrim" law; mockup's 0.6 alpha vs. the documented 0.35 — see C15.)
- Sheet: anchored bottom, max-height 94%, `--surface`, radius `32px 32px 0 0` (token ✓),
  `--e5`, slide-up 320ms `--ease-spring`. Grabber 40×5 pill `--canvas-sunken` centered.
- Header (padding `8px 20px 6px`): title 18/700/−0.02em, optional sub 12.5px secondary.
- Body: scrollable, padding `12px 20px 8px`, column gap 16.
  - (Invite only) Name field, then Phone field (with static "+91" 13px tertiary prefix),
    each: 12.5/500 secondary label above a 46px borderless input box, radius 12,
    `--surface-alt` bg, `--e1` (**CONFLICT C6: mockup composes raw field boxes instead
    of `_ds` Input; Input's leading slot + mono prop cover this**). Helper under phone:
    11.5px tertiary.
  - Role toggles: 6 stacked rows, gap 8. Each row = full-width pressable pill-corner
    row (radius 14, padding `12px 14px`): label 14/500 + description 11.5px secondary
    on the left, a 42×25 switch (19px white thumb, track `--accent` when on,
    `--canvas-sunken` when off) on the right. Row bg `--accent-subtle` when on,
    `--surface-alt` + `--e1` when off; bg transition 140ms.
  - **Grant-line card**: radius 16, padding 16; bg `--accent-subtle` (normal) or
    `--danger-bg` (blocked). Contains 32px white icon circle (check / alert icon in
    `--accent` or `--danger`), an 11/700/UPPERCASE/0.1em overline (**CONFLICT C7:
    tracking 0.1em vs the sanctioned 0.12em**), the plain-language grant sentence
    14.5/600/1.45, and (when a home screen resolves and not blocked) an accent text
    link "Home screen: {label} ↗". When blocked, a list of danger-coloured reasons
    (12.5px, circle-x icon 15px) appears below.
- Footer (sticky, padding `12px 20px 22px`, same raw top-shadow as C4): two buttons,
  gap 10 — "Cancel" (flex:1, 46px, `--neutral-bg`) and the save button (flex:1, 46px,
  `--action-primary`/white; disabled = opacity 0.4 + pointer-events none).

**Mobile Roles reference sheet**: same shell; body is 6 role cards (bg `--surface-alt`,
radius 16, `--e1`, padding 15): role name 14.5/600 + holder-count chip (20px pill,
10.5/600 — **CONFLICT C8: 10.5px sub-12 and not the overline exception**;
`--accent-subtle`/`--accent`, or `--neutral-bg`/`--text-tertiary` when "No one yet"),
then per-capability check rows (14px green check + 12.5px secondary text). Ends with an
info note card (`--info-bg`, radius 13, info icon, 12px body).

### 2.2 TeamRoles — Desktop · 1440 (functional density; app shell with sidebar)

Frame 1440×900:

1. **Sidebar** — width **240px** (**CONFLICT C9: layout token says 260px expanded**),
   `--surface`, `--e1`, padding `22px 16px`. Top: 38px gradient-brand "H" logo tile
   (radius 11) + "HelioGrid" wordmark 19/700 with gradient-clipped "Grid". Nav rows
   (44px, radius 12, icon 20px + label 14px): My Day, Leads, Proposals, Projects.
   Pinned bottom: Settings row in **active state** (`--accent-subtle` bg, `--accent`
   text, 500) + user row (38px initials avatar `--accent-subtle`, "Rajesh Patil"
   13.5/500, "Owner" 12px secondary).
2. **Header row** (padding `20px 30px 18px`, gap 16): back chip "‹ Settings" (36px pill,
   `--neutral-bg`) · title "Team & roles" 22/700/−0.025em with 13px count sub-line ·
   ghost pill "Roles reference" (40px, `--neutral-bg`, info icon) · primary pill
   "Invite someone" (40px, `--action-primary`, user-plus icon). Heights 36/40 = Button
   md ✓ except the 36px back chip (C3-adjacent).
3. **Team table** — white card max-width 1040, radius 20 (**C2: off card scale**),
   `--e2`. Header row: CSS grid `2.2fr 2.6fr 1.4fr 1.4fr 1fr`, gap 16, padding
   `13px 24px`, bg `--surface-alt`; column labels 11/500/UPPERCASE/0.04em
   `--text-tertiary` (**CONFLICT C10: 11px header labels that are neither the 11/700/
   0.12em overline nor ≥12px; and meaning-bearing text in `--text-tertiary`**).
   Body rows: same grid, padding `15px 24px`, zebra `--surface`/`--surface-alt`
   (token ✓). Cells: Person (40px avatar + name 14/600 + meta 11.5 tertiary) · Roles
   (wrapped chips) · Status (chip) · Home screen (accent text-link "{label} ↗", or
   "—" tertiary) · right-aligned actions: "Assign roles" (active), "Resend" (invited),
   "Restore" (deactivated) — 32px `--neutral-bg` pills (= Button sm height ✓, but
   sub-44 pointer targets on desktop are acceptable per coarse-pointer rule only if
   `pointer: fine`).
4. **Info footnote card** below table: `--surface-alt`, radius 16, info icon 18px,
   12.5px secondary text about role-union + deactivation semantics.

**Desktop modal** (Assign / Invite / Error): centered 540px, radius 24, `--e5`, enter
320ms spring (fade + rise 10px + scale 0.98→1); same backdrop treatment (alpha 0.62).
Contents identical to the mobile sheet except: Name + Phone side-by-side (flex, gap 14),
role toggles in a **2-column grid** (gap 10), grant-line text 15.5/600, footer buttons
right-aligned (Cancel 44px `--neutral-bg` pill, save 44px primary pill).

**Desktop Roles reference modal**: centered 840px, radius 24, `--e5`. Body: horizontally
scrollable matrix (min-width 740) — grid `2.4fr repeat(6, 1fr)`; sticky header row with
role names 12/600 and holder counts in `--font-mono` 10.5px (C8); 7 capability rows
(13px label; center cells: 17px `--success` check when granted, 5px `--text-disabled`
dot when not; zebra via `--surface-alt`, radius 10). Footer: info note card
(`--info-bg`, radius 14).

**Toast** (both breakpoints): bottom-center pill, `--action-primary` bg, white text
13.5/500, leading 17px check, radius 999, `--e4`, enter 240ms `--ease-enter`
(fade + rise 10px), auto-dismiss ~3200ms (**CONFLICT C11: `_ds` Toast is a white card
with a tinted semantic icon circle — the near-black pill toast is a different
component; either extend Toast with a variant at generation level or restyle to the
`_ds` Toast**).

### 2.3 SetupLater — collapsible card (expressive density)

Single white `--surface` card, radius 16 (**C2: off card scale 24/12**), `--e1`.

1. **Card header** (always visible; whole row is a button, padding `16px 18px`, gap 14):
   40px `--neutral-bg` icon circle (settings gear, `--text-secondary`) · title
   "Finish setting up later" 14.5/500 + sub 12.5 tertiary · trailing progress label
   "{n} of 3 done" 12/500 secondary `tabular-nums` · chevron-down 20px that rotates
   180° (200ms `--ease-standard`) when expanded.
2. **Expanded body** (padding `0 12px 14px`, column gap 8): three **accordion
   sub-sections**, each a `--surface-alt` rounded-14 block with its own header button
   (padding 14, gap 12: 36px `--neutral-bg` icon circle · title 14.5/500 + status
   sub-line 12.5 (tertiary; turns `--success` 500 once saved) · 22px `--success`
   check-circle badge once saved · rotating chevron 18px). Exactly **one section open
   at a time** (opening one closes the other).

   - **Logo section body** (padding `4px 16px 18px`):
     - No file: **drop zone** — dashed `1.5px dashed var(--text-disabled)` border
       (sanctioned dashed exception), radius 14, `--surface` bg, padding `28px 16px`,
       centered upload icon 26px + primary line 14/500 + constraint line 12.5 tertiary.
       Drag-over: border/bg switch to `--accent` / `--accent-subtle` (140ms).
     - File chosen: preview row card (`--surface`, radius 12, `--e1`, padding 12):
       52px thumb well (radius 10, `--canvas-sunken`; `object-fit: contain` img, or
       file glyph fallback) · filename 14/500 ellipsized + size 12.5 tertiary
       `tabular-nums` · text links "Replace" (accent 13.5/500) and "Remove"
       (secondary 13.5/500) (**CONFLICT C12: bare text-links, sub-44 targets**).
     - Error line 12px `--danger`; warning line 12px `--warning` with 14px triangle
       icon (**CONFLICT C13: bare `--warning` text fails contrast — law requires
       warning text to sit on `--warning-bg` chip**).
     - Footer: `_ds` **Button** `variant="primary" size="md"` "Save logo" (the mockup
       itself imports the real `_ds` Button here — the only place it does).
   - **GST section body** (padding `4px 16px 18px`, gap 14): three labelled fields
     (label 13/500 secondary):
     - GSTIN — 52px borderless field, radius 14, mono 16px, `letter-spacing 0.04em`,
       uppercase, `tabular-nums`; focus = `--e2` + double ring
       `0 0 0 2px var(--surface), 0 0 0 4px var(--accent)`; error =
       `inset 0 0 0 1.5px var(--danger)` (exact `_ds` Input focus/error contract ✓).
     - Legal business name — same field, sans 16px.
     - State — **read-only derived well**: 52px, `--canvas-sunken` bg, radius 14; shows
       placeholder text, or (valid GSTIN) 16px green check + state name + tertiary
       suffix.
     - Footer: Button primary md "Save GST details".
   - **Team section body** (padding `4px 16px 18px`, gap 12): repeatable **person
     rows** — white card (radius 12, `--e1`, padding 14):
     - Header: overline "PERSON {n}" 12/700/UPPERCASE/0.1em tertiary (**CONFLICT C14:
       overline spec is 11px/0.12em and meaning-bearing overlines use
       `--text-secondary`**) + remove ✕ icon button (16px glyph, 4px padding —
       sub-44 target, C12) shown only when >1 rows.
     - Phone field: 52px field with bold mono "+91" prefix + mono 16px input,
       `letter-spacing 0.1em`, `tabular-nums`.
     - Role picker: label 13/500 "Role · pick one or more" + wrapped selectable chips
       (34px pills — **C12 sub-44**): selected = `--accent-subtle`/`--accent` with 13px
       leading check; unselected = `--neutral-bg`/`--text-secondary`.
     - "Add another" — accent text button with plus icon (C12).
     - Footer: Button primary md, dynamic label.

   Desktop variant differs ONLY in drop-zone copy ("…or drag a file here"); layout is
   identical (see Open Questions Q16).

Spacing rhythm across both files is the 4px base scale except odd one-offs (11, 13, 15,
18, 22, 26, 30 paddings/gaps) — normalize to nearest token step at build time.

---

## 3. EXACT COPY (verbatim; `{…}` = dynamic)

### 3.1 TeamRoles — screen chrome
| Where | String | Dynamic? |
|---|---|---|
| Mobile/desktop title | `Team & roles` | — |
| Mobile sub / desktop sub | `{activeCount} active · {invitedCount} invited` / `{activeCount} active · {invitedCount} invited · six fixed roles` | counts |
| Desktop back chip | `Settings` | — |
| Header buttons | `Roles reference` · `Invite someone` | — |
| Bottom bar (mobile) | `Invite someone` | — |
| Table headers | `Person` · `Roles` · `Status` · `Home screen` | — |
| Row actions | `Assign roles` · `Resend` · `Restore` | — |
| Home cell | `{My Day\|Survey mode} ↗` or `—` | derived from roles |
| Status chips | `Active` · `Invited` · `Deactivated` | enum |
| Deactivated history note | `42 surveys stay attributed to their projects.` | count + noun dynamic |
| Table footnote | `Someone with several roles gets the union of what each grants, and sees the widest set of leads. A deactivated person is never deleted — their past work stays attributed to their projects.` | — |
| Meta line samples | `Active now · you` / `Active today · +91 98230 11902` / `Active 1h ago · +91 98450 33218` / `Invited 2 days ago · +91 97640 22115` / `Deactivated 5 May 2026` | all dynamic (relative time + phone) |

### 3.2 TeamRoles — roles (labels, descriptions, verbs)
| Role | Description (toggle sub-line) | Grant verb |
|---|---|---|
| `Owner` | `Full access — the business and settings` | — (special sentence) |
| `Manager` | `Team, all leads, project coordination` | `manage the team & projects` |
| `Sales rep` | `Own leads, create & send proposals` | `sell` |
| `Surveyor` | `Visit sites and record the survey` | `survey` |
| `Designer` | `Design the system and layout` | `design` |
| `Engineer` | `Installation and the on-site checklist` | `install` |

### 3.3 TeamRoles — sheets/modals
- Sheet titles: `Invite someone` · `Assign roles · {name}` (samples: `Assign roles · Priya Nair`, `Assign roles · Rajesh Patil`).
- Sheet subtitles: `Add a teammate by phone and pick their roles` (invite) ·
  `Toggle roles — the line below shows what you're granting` (assign) ·
  `Every held role adds access — this account still needs an Owner` (error view).
- Field labels: `Name` · `Phone number` · `Roles` with lighter suffix `· pick one or more`.
- Placeholders: `Full name` · `98XXX XXXXX` (after static `+91`).
- Phone helper — mobile: `They'll get a WhatsApp invite to join with these roles.`
  desktop: `They'll get a WhatsApp invite to join with the roles you pick below.`
  (**two different strings for the same helper — pick one; see Q5**)
- Grant-line overline: `What this grants` · blocked: `Can't save yet`.
- Grant sentence patterns (dynamic, assembled): `{name} owns the account — full access to everything.` ·
  `{name} has no role yet — pick at least one.` ·
  `{name} can {verb[, verb] and verb}.` (e.g. `Priya Nair can sell and survey.`)
- Home link: `Home screen: {My Day|Survey mode} ↗`
- Block reasons: `You can't remove the last Owner — every account needs one.` ·
  `Everyone needs at least one role — pick one to continue.` ·
  `Pick at least one role — a teammate can't have none.` (typographic apostrophes ’ in source)
- Footer: `Cancel` · `Send invite` (invite) · `Save roles` (assign)
- Roles reference titles/subs: `Roles reference` — mobile sub `Six fixed presets · read-only in v1`,
  desktop sub `Six fixed presets and what each grants · read-only in v1`.
- Holder-count chip: `No one yet` · `1 person` · `{n} people` (dynamic).
- Capability rows (7): `See every lead in the pipeline` (Owner, Manager) ·
  `Create & send proposals` (Owner, Manager, Sales rep) ·
  `Survey a site & record measurements` (Owner, Surveyor) ·
  `Design the system & panel layout` (Owner, Designer) ·
  `Manage projects — stages, payments, docs` (Owner, Manager) ·
  `Run the on-site install checklist` (Owner, Manager, Engineer) ·
  `Manage team, roles & company settings` (Owner)
- Matrix column header: `Capability`.
- Info note — mobile: `Project coordination is the Manager role. A dedicated crew/installer role is coming later — the coordinator runs the install checklist for now.`
  desktop: `Project coordination — move stages, record payments, upload docs — is the Manager role; there's no separate coordinator. A dedicated Installer/crew role (install checklist only) is coming later; the coordinator runs the checklist for now.` (bolded `Manager`)
- Toasts: `Invite sent — they now appear as "invited"` (source uses curly “invited”) ·
  `Roles saved` · `Invite resent` · `Restored — Amit is active again` (`{name}` dynamic).
- Sidebar (desktop chrome): `HelioGrid` · `My Day` · `Leads` · `Proposals` · `Projects` · `Settings` · `Rajesh Patil` / `Owner`.

### 3.4 SetupLater
- Card header: `Finish setting up later` · sub `Company logo · GST details · invite your team` · counter `{n} of 3 done`.
- **Logo**: `Add company logo` · sub `PNG or JPG, shown on your proposals` → saved `Logo added` ·
  drop zone `Tap to choose a file` (mobile) / `Tap to choose, or drag a file here` (desktop) ·
  constraints `PNG or JPG · max 5 MB · at least 300px wide` · file size `{x.x} MB` / `{n} KB` (dynamic) ·
  links `Replace` / `Remove` · errors `Use a PNG or JPG file` ·
  `That file is {mb} MB. Maximum is 5 MB.` · `Too small to print clearly. Use an image at least 300px wide.` ·
  warning `Tall logos may be cropped on your proposal.` · button `Save logo`.
- **GST**: `Add GST details` · sub `For GST-compliant proposals` → saved `{GSTIN} · {StateName}` ·
  label `GSTIN` placeholder `27AABCU9603R1ZX` · errors `GSTIN must be 15 characters` ·
  `That doesn't look like a valid GSTIN. Check the format: 27AABCU9603R1ZX` ·
  `The first two digits aren't a valid state code` ·
  label `Legal business name` + lighter suffix `· as on your GST certificate` ·
  placeholder `e.g. Suryodaya Solar Pvt Ltd` · error `Enter the legal name (at least 3 characters)` ·
  label `State` · empty well `Filled from your GSTIN` · filled `{StateName}` + suffix `— from your GSTIN` ·
  button `Save GST details`.
- **Team**: `Invite your team` · sub `Add colleagues by phone number` → saved `{n} invite sent` / `{n} invites sent` ·
  row overline `Person {n}` (rendered uppercase) · phone prefix `+91` placeholder `98765 43210` ·
  errors `Enter a 10-digit mobile number` · `That isn't a valid Indian mobile number` ·
  `That's your number — you're already here` · `You've already added this number` ·
  role label `Role · pick one or more` · chips `Manager` `Sales rep` `Surveyor` `Designer` `Engineer` ·
  error `Pick at least one role` · `Add another` · button `Send invite` / `Send {n} invites`.

All copy is EN-only in the mockups; every string above becomes a Lingui catalog message
(EN/HI/MR). The grant sentence is string-concatenated in the mockup — **must be rebuilt
as an ICU message with a list-format select, never concatenation** (i18n rule).

---

## 4. COMPONENT MAP (against the implemented `_ds` API in packages/ui)

| Mockup element | `_ds` component + props | Notes |
|---|---|---|
| Back / info circular buttons (mobile) | `IconButton size={40} variant="surface" label="Back"/"Roles reference"` | mockup 38px → snap to 40 (C1) |
| "Invite someone" (mobile bottom bar) | `Button variant="primary" size="lg" fullWidth icon={<UserPlus/>}` | 46px → lg 48 (C5) |
| "Invite someone" (desktop header) | `Button variant="primary" size="md" icon={<UserPlus/>}` | 40px ✓ |
| "Roles reference" ghost pill | `Button variant="secondary" size="md" icon={<Info/>}` | neutral-bg pill = secondary |
| "‹ Settings" back chip | `Button variant="secondary" size="sm" icon={<ChevronLeft/>}` | mockup 36px is off-scale (sm 32 / md 40) |
| "Assign roles" / "Resend" / "Restore" table pills | `Button variant="secondary" size="sm"` | 32px ✓; mobile Restore 30px → sm 32 (C3) |
| Sheet footer "Cancel" | `Button variant="secondary" size="lg"` (mobile) / `size="md"` (desktop) | |
| "Send invite" / "Save roles" | `Button variant="primary" size="lg|md" disabled={blocked}` | disabled prop replaces opacity hack |
| Person avatar | `Avatar name={p.name} size={40}` | deactivated grey treatment needs a style override — not a prop (composition) |
| Role chips (display, TeamRoles) | `Badge tone="accent"` (Owner) / `Badge tone="neutral"` (others) `density="functional"` | non-interactive → Badge, not Chip |
| Member status chip | **DOES NOT MAP** — `StatusChip` `WorkflowStatus` enum is lead/survey/…/on-hold only; Active/Invited/Deactivated are not members | use `Badge tone="success|warning|neutral"`; Active's 6px dot needs `Chip dot` semantics on a Badge → **CONFLICT C16: needs a marked extension or composed dot** |
| Role toggle row (sheet) | **composition**: pressable row wrapping text block + `Switch checked onChange` | not a bare Switch-with-label; row tint/selected treatment is custom |
| Name/Phone fields (invite sheet) | `Input label="Name"` · `Input label="Phone number" mono inputMode="tel" leading={+91}` with `error`/`helper` props | mockup hand-rolls the boxes (C6) |
| Grant-line card | **composition**: `Card density="functional"` + `IconCircle icon={Check/AlertCircle} color="var(--accent)|var(--danger)"` + overline + text | tinted card bg (`--accent-subtle`/`--danger-bg`) is not a Card prop |
| Info note cards (`--info-bg`) | **composition**: tinted panel + info icon | no Callout/Alert in the 21 |
| Roles-reference role cards | `Card density="functional"` + `Badge` (holder count) + check list | |
| Capability matrix (desktop) | **composition** (CSS grid) | no Table/DataTable in the 21 |
| Team table (desktop) | **composition** (CSS grid + zebra) | ListRow can't do 5-column grids |
| Person card (mobile) | **composition** on `Card interactive density="expressive"` | 3-slot ListRow is insufficient (chips row + footer) |
| Toast | `Toast tone="success" title={…}` | mockup's near-black pill ≠ `_ds` white Toast card (C11) |
| Sheet/modal shells | **composition** (no Sheet/Modal in the 21) — Radix Dialog under the hood per CLAUDE.md §Design + docs/10, styled per §2.1 | focus trap/restore mandatory |
| Sidebar / nav rows | **composition** (app shell, not in the 21) | |
| SetupLater card + section headers | **composition**: `Card` + `IconCircle icon color="var(--text-secondary)"` (36/40px) + rotating chevron | accordion pattern not in the 21 |
| Saved check badge (22px) | **composition** (success circle + check) | |
| Progress label "{n} of 3 done" | plain text, `tabular-nums` | |
| Drop zone | **composition** — sanctioned dashed-border exception | |
| Logo preview row | **composition** on `Card density="functional"` | |
| "Replace"/"Remove"/"Add another" | `Button variant="ghost" size="sm"` | mockup uses bare text links (C12) |
| GSTIN / legal-name / phone fields | `Input mono error label helper leading` | GSTIN needs uppercase transform + strip mask (controlled value) |
| State derived well | **composition**: read-only well (`--canvas-sunken`) | Input has no read-only "derived" visual; could be `Input disabled success` but visual differs |
| SetupLater role chips | `Chip active={sel} tone="accent" density="functional"` with leading check | Chip is a button ✓; 34px height vs Chip's own — verify against gallery |
| Remove ✕ per row | `IconButton size={32} variant="ghost" label="Remove"` | |
| Save buttons | `Button variant="primary" size="md" disabled` | mockup already imports `_ds` Button here |

**Raw values not derivable from tokens (roll-up):** 38/36/30/46px control heights ·
radius 18/20/16/13/11/10 on cards/wells (token card radii are 24/12; inputs 14/10 —
16/13/11/18/20 are off-scale) · font sizes 10.5/11.5/12.5/13.5/14.5/15.5/16/18/19/22/26
(scale is 11 overline, 12, 13, 15, 17, 20, 24, 32, 40) · sticky-footer shadow
`0 -6px 16px -12px rgba(10,10,11,0.16)` · backdrop alphas 0.6/0.62 · grabber 40×5 ·
switch geometry 42×25/19 (must come from `_ds` Switch, not re-drawn) · sidebar 240px ·
matrix min-width 740 / modal widths 540/840 (fine as layout constants if tokenized).

---

## 5. STATES & INTERACTIONS

### 5.1 TeamRoles — mock state enum (6): `team | assign | invite | roles | error | deactivated`

**team (default)** — roster list/table. Row affordances by status:
- `active`: card tap / "Assign roles" opens Assign; home-screen link navigates.
- `invited`: only "Resend" (fires toast `Invite resent`); card inert.
- `deactivated`: opacity 0.72, grey avatar, only "Restore" (fires toast
  `Restored — {name} is active again` and returns them to active); card inert.
Counts in the header recompute from the roster.

**assign** — sheet/modal for an existing member ("Assign roles · {name}").
- Toggling any role instantly recomputes: the grant sentence, the derived home screen
  (`owner|manager|sales → My Day`, else `survey → Survey mode`, else
  `design|engineer → My Day`), and the blocked state.
- Zero roles selected → grant-line card flips to danger, overline `Can't save yet`,
  reason `Pick at least one role — a teammate can't have none.`, home link hidden,
  save disabled.
- Save → close, toast `Roles saved`.

**invite** — same surface plus Name + Phone fields above the toggles; default
pre-selection in mock: Sales rep ON (assign mock default: Sales rep + Surveyor ON).
Save → close, toast `Invite sent — they now appear as "invited"`; new roster row with
status `Invited`. The mockup does NOT validate name/phone in this sheet (static
placeholders) — implement with SetupLater's phone rules (Q5).

**error** — the Assign sheet rendered for the last Owner with all roles off. TWO
stacked reasons: last-owner + at-least-one-role. Save disabled. This is the
"blocked change" state, not a network error state.

**roles** — read-only reference (sheet on mobile, 840px matrix modal on desktop).
No inputs; scrollable; matrix header sticky; horizontal scroll INSIDE the modal body
(page never scrolls horizontally).

**deactivated** — roster variant where one member is deactivated; shows history
footer + Restore.

**Motion**: backdrop fade 200ms `--ease-enter` + blur 8px; sheet slide-up 320ms
`--ease-spring`; modal fade/rise/scale 320ms spring; toast enter 240ms, auto-dismiss
3200ms (repeat toasts reset the timer); toggle-row bg 140ms; switch track/thumb 200ms
(`--ease-standard` / spring). `prefers-reduced-motion` collapses all to 1ms.

**Focus/keyboard** (to implement; mockup does not): sheet/modal = focus trap, initial
focus on first field (invite) or first toggle (assign), Esc closes = Cancel, focus
restored to the opener; backdrop click closes; toggle rows are buttons (Space/Enter);
save is the terminal tab stop. Focus ring: 2px `--accent` at 2px offset, never removed.

**Missing states (design gaps, DoD requires them)**: list loading (skeleton), list
empty (solo owner — EmptyState with "Invite someone" action), fetch error, offline
(OfflineBanner; invites queue?), save-in-flight (`Button loading`), resend cooldown.
See Open Questions.

### 5.2 SetupLater

Widget state: `expanded` (bool) × `open` (`'' | logo | gst | team`) × per-section
`saved` flags. Header chevron rotates; counter live-updates; saved sections keep their
header check + green sub-line and can be re-opened (content persists in-session).
Exactly one section open; opening another collapses the current.

**Logo**: idle drop zone → drag-over highlight → file chosen (preview card) →
error / warning → saved.
Validation (client): type ∈ {image/png, image/jpeg} else `Use a PNG or JPG file`;
size ≤ 5 MB (5×1048576) else `That file is {mb} MB. Maximum is 5 MB.` (1 decimal);
decoded `naturalWidth ≥ 300` else `Too small to print clearly…`; `height > width` →
non-blocking warning `Tall logos may be cropped on your proposal.` Unreadable image →
type error. Save disabled while no file or any error. Replace re-opens picker; Remove
clears to drop zone. File input `accept="image/png,image/jpeg"`, hidden, value reset
after each pick (re-selecting the same file re-triggers). Save → `savedLogo`, section
collapses, sub `Logo added`.

**GST**: GSTIN input mask: uppercase, strip non-`[A-Z0-9]`, hard cap 15.
Errors evaluated in order: length ≠ 15 → `GSTIN must be 15 characters`; fails
`/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/` → `That doesn't look
like a valid GSTIN…`; first two digits not 01–38 → `The first two digits aren't a
valid state code`. Error display is **touched-on-blur, then live**: no error until
first blur; after that, recompute on every change. Focus/error visuals per the `_ds`
Input contract (double accent ring / 1.5px danger inset). State well auto-fills from
the 38-entry state-code table (01 Jammu & Kashmir … 27 Maharashtra … 38 Ladakh) the
moment the GSTIN is fully valid; otherwise shows placeholder. Legal name: trimmed
length ≥ 3, same touched-on-blur pattern. Save enabled only when GSTIN valid AND name
valid → `savedGst`, collapse, sub `{GSTIN} · {StateName}`.

**Team**: rows start at 1; `Add another` appends; ✕ removes (only visible when >1).
Phone mask: digits only, cap 10. Row errors (order): length ≠ 10 → `Enter a 10-digit
mobile number`; not starting 6–9 → `That isn't a valid Indian mobile number`; equals
the signed-in user's number → `That's your number — you're already here`; duplicates
an EARLIER row → `You've already added this number` (only the later row errors).
Phone errors show after that row's blur; role error `Pick at least one role` shows
after first chip interaction on that row (`roleTouched`). Role chips multi-select;
**Owner is not offered** (5 chips). Save label pluralizes (`Send invite` /
`Send {n} invites`); disabled until every row has a valid phone AND ≥1 role.
Save → `savedTeam`, collapse, sub `{n} invite(s) sent`.

No loading/offline/server-error states are designed for any of the three saves (all
are instant local mutations in the mock) — real implementation needs `Button loading`,
failure toasts, and offline queuing per mobile rules.

---

## 6. NAVIGATION

**TeamRoles**
- Entry: Settings screen (`Settings.dc.html`) → Team & roles row; desktop sidebar
  Settings (active state shown).
- Back: mobile 38→40px back IconButton and desktop "‹ Settings" chip → `Settings.dc.html`.
  Mobile is a nested screen: **no bottom nav** (per mobile nav rules).
- Sidebar exits (desktop): My Day (`MyDay.dc.html`), Leads (`Leads.dc.html`),
  Proposals (`Proposals.dc.html`), Projects (dead in mock).
- Home-screen links: `MyDay.dc.html` / `SurveyMode.dc.html` (both mockups exist).
- Overlays: backdrop tap or Cancel returns to `team`; no route change implied
  (sheet state, not navigation) — deep-link behaviour undefined (Q).
- Invite recipient continues in `InviteLanding.dc.html` / `InviteFlow.dc.html`
  (WhatsApp deep link → join with OTP).

**SetupLater**
- Embedded in a host screen (not shown — Q12). No routes of its own; all interaction
  is in-card. The team section's "send invites" must land the invitees in the same
  invited-list as TeamRoles (single invite pipeline).

---

## 7. ICONS (Lucide best-guess, 1.5px stroke default; mockup strokes vary 1.5–2.6)

**TeamRoles**: `chevron-left` (back), `info` (roles reference, info notes),
`chevron-right` (card affordance), `user-plus` (invite), `check` (capability ticks,
toast, grant line), `circle-x` (block reasons), `circle-alert` (blocked grant line),
`rotate-ccw` (deactivated history), `house` (My Day nav), `users` (Leads nav),
`file-text` (Proposals nav), `layout-grid` (Projects nav), `settings` (Settings nav),
`arrow-up-right` (REPLACES the `↗` unicode — see C17).

**SetupLater**: `settings` (card header), `chevron-down` (expand/collapse),
`image` (logo section), `upload` (drop zone), `file-text` (GST section; also the
no-thumb file fallback = `file`), `users` (team section), `check` (saved badges, state
well, selected chips), `x` (remove row), `plus` (add another),
`triangle-alert` (logo warning).

**CONFLICT C17**: the mockups use `↗` (home links) and `‹` (variant caption) as
unicode-in-text icons — CLAUDE.md §Design + docs/10 forbids unicode-as-icon; render `arrow-up-right` /
`chevron-left` Lucide glyphs instead.

---

## 8. CONFLICTS (consolidated)

- **C1** 38px icon buttons < 44px touch target; IconButton enum 32|40|48 → 40.
- **C2** Card radii 18/20/16/13/12/11/10 off the 24-expressive/12-functional scale.
- **C3** Button heights 46/36/30 off the 48/40/32 scale.
- **C4** Raw sticky-footer shadow `0 -6px 16px -12px rgba(10,10,11,0.16)` — needs a
  generation-time token (or drop for a hairline-free elevation treatment).
- **C5** Mobile primary/save/cancel at 46px → Button lg 48.
- **C6** Invite sheet hand-rolls input boxes → use `_ds` Input (leading/mono/error).
- **C7** Grant-line overline tracking 0.1em (spec 0.12em); SetupLater row overline
  12px/0.1em (spec 11px/0.12em) and both use `--text-tertiary` for meaning-bearing
  micro-labels (spec: `--text-secondary`).
- **C8** Sub-12px meaning-bearing text: 11.5px meta lines/chip labels, 10.5px holder
  counts — only the 11px overline is sanctioned below 12px. Meta lines also put phone
  numbers (numerics-as-data → should be `--font-mono`) in sans `--text-tertiary`.
- **C9** Sidebar 240px vs layout token 260px.
- **C10** Table headers 11px/500/uppercase/0.04em `--text-tertiary` — neither overline
  spec nor 12px floor; load-bearing text in tertiary.
- **C11** Toast is a near-black `--action-primary` pill; `_ds` Toast is a white card
  with tinted semantic icon. Pick one (recommend `_ds` Toast) or extend at generation.
- **C12** Sub-44 interactive targets: Replace/Remove/Add another text links, 34px role
  chips, 24px row-remove ✕, 30px Restore.
- **C13** Bare `--warning` text on white (logo warning) — law requires warning text on
  `--warning-bg` chip.
- **C14** = C7 (SetupLater overline).
- **C15** Backdrop white-fade alpha 0.6/0.62 vs documented 0.35 — pick the token value.
- **C16** Active/Invited/Deactivated do not exist in `StatusChip.WorkflowStatus`; needs
  Badge composition (+dot) or an approved StatusChip extension for member states.
- **C17** Unicode `↗`/`‹` as icons — replace with Lucide.
- **C18** Non-scale font sizes throughout (10.5–15.5, 18, 19, 22, 26) — snap to the
  type scale (12/13/15/17/20/24).
- **C19** Grant sentence built by string concatenation — must become ICU messages
  (list formatting) for HI/MR.
- **C20** Two different phone-helper strings (mobile vs desktop) for the same field.

---

## 9. OPEN QUESTIONS / AMBIGUITIES

1. **Missing loading/empty/error/offline states** for the roster, all three overlays,
   and all SetupLater saves — DoD requires all four; none are designed.
2. **No deactivate affordance.** Restore exists; nothing deactivates a member (not in
   the Assign sheet, not in the table). Where does deactivation live, and is it
   confirmed + undoable per destructive-action law?
3. **Invited members**: can their roles be edited before acceptance? Can an invite be
   revoked/cancelled? Only "Resend" is designed. Resend rate-limit/cooldown?
4. **Last-owner rule scope**: error copy covers removing the last Owner's role — can a
   second Owner be granted via Assign (Owner toggle exists there)? Transfer-ownership
   flow undefined.
5. **Invite sheet validation** (TeamRoles) is not implemented in the mock — assume
   SetupLater's phone rules + dedupe against existing members/invitees? Also
   reconcile the two helper strings (C20).
6. **Role list inconsistency**: SetupLater offers 5 roles (no Owner); TeamRoles invite
   offers all 6 including Owner. Which is correct for inviting?
7. **Home-screen precedence** (`owner|manager|sales` beats `survey`): a Sales rep +
   Surveyor gets My Day, not Survey mode — intended product rule? Trace to D-decisions.
8. **Holder counts** in Roles reference: do deactivated members count? (Mock hardcodes
   counts that ignore the deactivated variant.)
9. **Capability matrix**: Manager lacks "Survey a site" and "Design the system" — but
   Manager sees all leads; confirm the matrix matches the D27 preset matrix exactly
   (it's also the source for the tenancy invariant test).
10. **"42 surveys stay attributed"** — is the history note computed per contribution
    type (surveys/designs/proposals) or a generic sentence?
11. **Toast for restore names the person** (`Restored — Amit is active again`) but the
    mock hardcodes Amit for any restore — parameterize.
12. **SetupLater host surface**: which screen embeds it (My Day? Owner dashboard?),
    on which platforms, and for whom (Owner only?).
13. **SetupLater completion/dismissal**: what happens at "3 of 3 done" — does the card
    disappear, persist, or offer dismiss? Can a saved section be edited later (it
    reopens in the mock but changes after save are unspecified — re-save flow?).
14. **GSTIN**: only format-validated; the checksum (15th char) and any GSTN/API
    verification are undefined; is legal name cross-checked against GSTIN?
15. **Logo upload pipeline** (Tigris presigned, offline queue on mobile) and whether
    "Save logo" uploads immediately or defers.
16. **SetupLater desktop variant** changes only the drop-zone string — confirm the
    desktop layout really is the same single-column card (max-width? host context?).
17. **Own-number check** uses hardcoded `9876543210` — must come from the session user.
18. **Overlay deep-links/back behaviour**: sheets are component state; should mobile
    hardware-back close the sheet (expected) and should invite/assign be routable?
19. **Table on 375**: desktop shows a 5-column grid; mobile uses cards ✓ — but the
    wide-table-to-card-list rule needs the 200-item volume test (realistic volume DoD).
20. **Invited row home-screen cell** shows a live link even though the person hasn't
    joined — intended?
