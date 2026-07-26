# Invite landing + profile — implementation spec (auth module)

Source mockups (read in full, spec derived verbatim):
- `design/mockups/InviteLanding.dc.html` — canvas wrapper: 375×812 phone frame + 1440×900 browser frame, both hosting `InviteFlow`.
- `design/mockups/InviteFlow.dc.html` — the interactive surface: 5 steps (`invite → otp → profile → done`, plus terminal `expired`) with full DCLogic state machine.

Related surfaces: `Login.dc.html` / `LoginFlow.dc.html` (the OTP step is explicitly "the same OTP as 1.1"), `SignUpFlow.dc.html` (owner self-signup), `TeamRoles.dc.html` (where the inviter sends invites), `MyDay.dc.html` (post-join destination implied by copy).

---

## 1. PURPOSE + place in the auth journey

The **invited-teammate onboarding** surface. An EPC owner/admin invites a teammate by
phone number (from Team & roles); the teammate opens the invite link
(`app.heliogrid.in/join` per the desktop browser chrome) and lands here. The flow:

1. **Invite** — shows *who* invited you, *which company*, and the phone number the
   invite was sent to (locked, pre-filled — the invite IS bound to that number).
2. **OTP** — verify possession of that number (6-digit SMS code; identical contract to
   Login flow 1.1, incl. resend timer and the "call me" escalation).
3. **Profile** — two fields only: optional photo + required name.
4. **Done** — confirmation, handing off to My Day ("Here's your day — work is already
   waiting for you.").
5. **Expired** (terminal branch) — invite links live 7 days; one-tap "ask the inviter
   to re-send" with a sent-confirmation state.

Distinct from SignUp (owner creates a tenant) and Login (existing member): this flow
**joins an existing tenant** with the role the inviter chose. The user never picks a
company, never types a phone number, and never sees pricing/plan anything.

Auth-backend mapping: invite token → MSG91 OTP on the pinned number → Better Auth
session → membership activated on the inviting tenant → profile (name/photo) written
to the user record. Server owns invite validity (7-day expiry) and re-request.

---

## 2. LAYOUT

### Shared scaffold (both viewports, all steps)

- Full-bleed `--canvas` page, `overflow:hidden`, with an ambient **brand bloom**
  behind the content: `--glow-brand` radial, centred horizontally, bleeding off the
  top. Mobile: 520×520 at `top:-150px`; desktop: 860×860 at `top:-180px`. Animated
  "breathing" loop: scale 1→1.09, opacity .85→1, 8s infinite, `--ease-standard`;
  fully disabled under `prefers-reduced-motion`. (Same atmosphere pattern as
  EmptyState's bloom — atmosphere, never information.)
- Content sits in a scrollable flex column (`overflow-y:auto`), centred both axes
  with `justify-content: safe center` (so short viewports scroll from the top instead
  of clipping). Root height is the host frame's 100% (the wrapper frames own the
  status bar / browser chrome); use `dvh`/`svh` in the real app, never `vh`.
- Column: `width:100%`, horizontal padding **26px mobile / 56px desktop** (see
  CONFLICT C-9), vertical padding **20px mobile / 0 desktop**, `max-width` **620px
  mobile / 400px desktop** — note the desktop column is deliberately *narrower*
  (400px single-column card-less form floating on canvas; no split-pane, no sidebar,
  no header). At 375px the effective content width is 323px.
- **Wordmark** first: "Helio**Grid**" — 22px/700/−0.02em, "Grid" filled with
  `--gradient-brand` via background-clip:text; 28px below it the step content starts.
- Every step's content block mounts with **fade+rise**: `hg-rise` 320ms
  `--ease-enter`, translateY 8px→0 (the DS "cards mount fade+rise 8px" rule applied
  to the whole step). Reduced-motion: none.
- Density: **expressive** throughout (onboarding surface — generous 16px radii, 56px
  fields, soft cards). No functional-density regions.
- No app chrome at all: no top bar, no bottom nav, no back button rendered (see OPEN
  Q-2). The desktop frame shows the URL `app.heliogrid.in/join` with a padlock.

### Per-step structure (top → bottom, left-aligned column)

**Invite**
1. Company-initial tile: 56×56, radius 18 (CONFLICT C-1), bg `--accent-subtle`,
   glyph = company initial ("S"), 24px/700/−0.02em, colour `--accent`.
2. H1 (27px/700/−0.02em/1.15, `text-wrap:pretty`), 20px below tile.
3. Company card, 16px below: white `--surface`, radius 16, `--e1`, padding 14×16;
   row = 40px `--neutral-bg` circle with building icon (20px) + name (15/500) over
   location (13, `--text-secondary`), 12px gap.
4. Locked phone block, 20px below: label (13/500 secondary) · 7px · field (56px tall,
   radius 16, bg `--canvas-sunken` — the "well", visibly non-editable; lock icon 17px
   `--text-tertiary` + number in `--font-mono` 18px/0.08em letter-spacing,
   tabular-nums) · 7px · helper line (12px `--text-tertiary`).
5. Primary CTA, 22px below: full-width Button primary/lg (48px).
6. (Demo-only footer link — not shipped.)

**OTP**
1. H1 30px/700/−0.025em/1.1.
2. Body 15/1.5 secondary, 10px below; phone number inline in primary/500/nowrap.
3. Six OTP boxes, 26px below, 10px gap: **46×54 mobile / 54×62 desktop**, radius 14
   (`--r-input-expressive`), bg `--surface`, centred `--font-mono` 22px mobile /
   26px desktop, 700, tabular-nums.
4. Error row (conditional), 14px below boxes: 16px alert icon + 13/500 `--danger`.
5. Resend row, 22px below: either accent link (14/500) or tertiary countdown with
   mono `0:SS`.
6. "Call me" card (conditional, after 2 resends), 18px below: white card radius 16
   `--e1`, padding 16×18; 40px `--accent-subtle` circle + phone icon (20px accent);
   two-line text stack (13.5px — CONFLICT C-6).
7. (Demo-only footer.)

**Profile**
1. H1 30px "Set up your profile" + body 15 secondary 10px below.
2. Photo row, 24px below: 80px circular button (bg `--canvas-sunken`, `--e1`;
   camera icon 30px tertiary when empty; the chosen image cover-fitted when set) ·
   16px gap · vertical stack of the accent action link (14/500: "Add a photo" /
   "Change photo"), then either "Remove photo" (13/500 secondary link) or
   "Optional" (12.5px tertiary — CONFLICT C-6). Hidden `<input type=file
   accept="image/png,image/jpeg">`.
3. Name field, 22px below: label (13/500 secondary) · 7px · 56px wrapper, radius 16,
   bg `--surface`, rest `--e1`; borderless 16px sans input.
4. Primary CTA, 24px below: full-width Button primary/lg, disabled until name
   non-blank.

**Expired**
1. 56px circle `--warning-bg` + clock icon 28px `--warning`.
2. H1 28px (CONFLICT C-5) 20px below; body 15 secondary 10px below.
3. Either the full-width primary CTA (24px below), or — after tapping — the
   confirmation panel: bg `--success-bg`, radius 16, padding 16×18; 36px solid
   `--success` circle with white 18px check (2.4 stroke) + 14/1.45 primary text.
4. (Demo-only "Back to the demo invite" link.)

**Done**
1. 64px circle `--success-bg` + check icon 30px `--success` (1.8 stroke).
2. H1 30px 22px below; body 15 secondary 10px below.
3. (Demo-only "Restart demo" link. Production: hand off to the app — OPEN Q-8.)

Spacing rhythm: the file mixes on-scale (16/20/24) with off-scale gaps (7/10/14/18/
22/26/28) — see CONFLICT C-9.

---

## 3. EXACT COPY (verbatim; ⟨…⟩ = dynamic)

Everything sentence case. Buttons are verbs. English source; all strings go through
Lingui (EN/HI/MR). Phone numbers, codes, and the wordmark never translate.

**Invite step**
- Tile glyph: `S` — ⟨company initial⟩
- H1: `Rajesh Patil invited you to join Suryodaya Solar` — ⟨inviter full name⟩ +
  ⟨company name⟩ both dynamic; inviter name is wrapped for emphasis (mockup gives it
  an explicit `--text-primary` span — visually identical to the rest of the h1;
  treat as a semantic slot, see OPEN Q-11). ICU message with two placeholders.
- Company card: `Suryodaya Solar` / `Pune, Maharashtra` — ⟨company⟩, ⟨city, state⟩.
- Label: `Your phone number`
- Field value: `+91 98765 43210` — ⟨invite phone, formatted⟩
- Helper: `The invite was sent to this number, so it can't be changed.`
- Button: `Continue`
- Demo-only: `Demo — view the expired-invite state` (NOT shipped)

**OTP step**
- H1: `Enter your code`
- Body: `Enter the 6-digit code sent to +91 98765 43210.` — ⟨phone⟩
- Error: `That code doesn't match. Check it and try again.`
- Resend (enabled): `Resend code`
- Resend (cooling down): `Resend code in 0:27` — ⟨countdown `0:SS`, mono⟩
- Call-me offer: `Still no code after two tries?` + link
  `Call me with the code instead`
- Call-me requested: `Calling +91 98765 43210 now with your code.` — ⟨phone⟩
- Demo-only: `Demo — the code is 424242. Type anything else to see the error state.`

**Profile step**
- H1: `Set up your profile`
- Body: `Just your name — a photo is optional. You'll be in straight after.`
- Photo action: `Add a photo` ↔ `Change photo` (state-dependent) · `Remove photo` ·
  `Optional`
- Photo button aria-label: `Add photo` · image alt: `Your photo`
- Label: `Your name` · placeholder: `e.g. Anita Deshmukh`
- Button: `Join Suryodaya Solar` — ⟨company⟩ interpolated in the verb (ICU)

**Expired step**
- H1: `This invite has expired`
- Body: `Invite links are valid for 7 days. Ask Rajesh to send a fresh one — it takes
  them a moment.` — ⟨inviter first name⟩
- Button: `Ask Rajesh to invite me again` — ⟨inviter first name⟩
- Confirmation: `Request sent. We've let Rajesh know — they'll send a new link to
  +91 98765 43210.` — ⟨inviter first name⟩ + ⟨phone⟩
- Demo-only: `Back to the demo invite`

**Done step**
- H1: `You're in, Anita` — `You're in, ⟨firstName⟩` (fallback when name somehow blank:
  `there` — demo artefact; production requires a name so the fallback should be
  unreachable, see OPEN Q-7)
- Body: `Welcome to Suryodaya Solar. Here's your day — work is already waiting for
  you.` — ⟨company⟩
- Demo-only: `Restart demo`

(The InviteLanding page's own header — `Invite landing + your profile · User
onboarding`, `Join a company`, the explainer paragraph, `Mobile 375 px`,
`Desktop 1440 px`, `9:41`, `app.heliogrid.in/join` — is canvas/demo chrome, not
product copy, except the URL which documents the deep-link host path.)

---

## 4. COMPONENT MAP (21-component `_ds` API — `packages/ui` / `apps/mobile/src/ui`)

| Mockup element | _ds component | Props | Notes |
|---|---|---|---|
| `Continue` CTA | **Button** | `variant="primary" size="lg" fullWidth` | 48px, pill, near-black ✓ |
| `Join Suryodaya Solar` CTA | **Button** | `variant="primary" size="lg" fullWidth disabled={!name.trim()}` | |
| `Ask Rajesh to invite me again` | **Button** | `variant="primary" size="lg" fullWidth` | |
| Name field | **Input** | `label="Your name" placeholder density="expressive"` | Impl is 52px/r14; mockup draws 56px/r16 → CONFLICT C-3/C-2 |
| Locked phone field | **Input** | `label helper disabled mono leading={<Lock/>}` | Mockup's well bg `--canvas-sunken` + 18px mono/0.08em is richer than Input's disabled state → verify Input disabled styling or compose; helper text maps to `helper` prop ✓ |
| Company card row | **Card** + **ListRow** (or Card + **IconCircle** + text) | Card `density="expressive"`; ListRow leading icon, title, subtitle, non-interactive | Card radius 16 vs `--r-card-expressive` 24 → CONFLICT C-2 |
| Building icon circle (40, neutral) | **IconCircle** | `icon={Building2} color="neutral" size={40}` | ✓ `size` prop exists |
| Call-me icon circle (40, accent) | **IconCircle** | `icon={Phone} color="accent" size={40}` | inside a Card `--e1` |
| Expired icon circle (56, warning) | **IconCircle** | `icon={Clock} color="warning" size={56}` | mockup is a full circle ✓ |
| Done icon circle (64, success) | **IconCircle** | `icon={Check} color="success" size={64}` | |
| Success-panel check (36, solid success) | — composition | | Solid `--success` fill + white glyph — IconCircle's 6%-tint contract doesn't cover a solid fill → CONFLICT C-10 |
| Company-initial tile (56, r18, accent-subtle, letter) | — composition (Avatar-adjacent) | | Avatar is circular initials; this is a rounded-*square* letter tile at off-scale r18 → CONFLICT C-1; compose or extend Avatar with `shape="tile"` |
| Photo picker (80px circle) | **Avatar** (size 80, image/placeholder) wrapped in a plain button | | Avatar renders the visual; the button/file-input behaviour is composition. Camera-icon empty state is not an Avatar state → composition |
| OTP boxes (×6) | — composition (new `OtpInput` molecule) | | NOT in the 21-component set. Six 1-char inputs reusing Input's shadow grammar (rest `--e1`, filled `--e2`, focus `--e2 + 0 0 0 2px surface + 0 0 0 4px accent`, error `inset 0 0 0 1.5px --danger, --e1`). Must live in `packages/ui` (screens can't raw-style) → CONFLICT C-4. Shared with LoginFlow — build once |
| Text links (`Resend code`, `Call me…`, `Add a photo`, `Remove photo`) | — none of the 21 | | Accent inline link-buttons (14/500), not pill Buttons. No Link/TextButton component exists → CONFLICT C-11; add a sanctioned link style or a `Button variant="ghost"` ruling (ghost is pill+padded, visually different) |
| Success confirmation panel | — composition | | Flat `--success-bg` tinted panel, radius 16. Not Toast (inline, persistent), not Card (tinted, no elevation). Compose from tokens |
| Countdown `0:27` | — text | | `--font-mono`, tabular-nums ✓ |
| Wordmark | — brand element | | gradient-brand text-clip; shared atom with Login/SignUp |
| Bloom layer | — composition | | `--glow-brand`, precedent: EmptyState bloom (owner ruling); RN needs the react-native-svg radial (landmine already solved for EmptyState) |
| Error row (icon + text) | — composition | | Matches Input's error-text pattern; inline under the OTP group |

Not used on this surface: Checkbox, Radio, Switch, Chip, Badge, AvatarGroup,
StatCard, StatusChip, EmptyState, OfflineBanner, ProgressBar, Toast,
SegmentedControl, Tabs, IconButton.

### CONFLICTS (raw values not derivable from ds tokens / API gaps)

- **C-1** Company-initial tile radius **18px** — not on the radius scale
  (8/12/16/24/32/40). Nearest: `--r-md` 16. Needs a ruling (use 16) or a marked
  token extension.
- **C-2** Cards and fields throughout use radius **16px** (`--r-md` exists, but the
  component contracts say cards 24 expressive / 12 functional, inputs 14/10). The
  mockup deliberately sits between densities on this surface. Ruling needed:
  either accept `--r-md` as the "onboarding surface" radius or snap to 24/14.
- **C-3** Field height **56px** vs implemented Input expressive **52px**; field
  padding 0 18px vs Input `--sp-4` (16). Snap to 52 or extend Input with a size.
- **C-4** OTP boxes: bespoke dims **46×54 mobile / 54×62 desktop**, font 22/26 —
  none derivable from token scales; radius 14 ✓ (`--r-input-expressive`). New
  component required in `packages/ui` + RN mirror.
- **C-5** Heading sizes **27px / 28px / 30px** — off the type scale (h1 32, h2 24).
  Mockup tracks −0.02/−0.025 correctly but sizes are bespoke. Ruling: snap to h1 32
  (or add a marked `--fs-h1-compact` extension); do not hand-inline.
- **C-6** Font sizes **13.5px** (call-me card) and **12.5px** ("Optional") — off
  scale (body-sm 13, caption 12). Snap to 13 / 12.
- **C-7** Phone-number letter-spacing **0.08em** and size 18px — no token; the mono
  numerics law covers the face, not this tracking. Extension or drop to 0.
- **C-8** OTP box-shadow transition **160ms** — motion scale is 120/200/320/500.
  Snap to 200 (or 120).
- **C-9** Off-scale spacing: mobile padX **26px** (scale has 24), gaps/margins
  **7/10/14/18/22/26/28px** (4px-base scale: …8/12/16/20/24…). Snap each to the
  nearest scale step during build; none is load-bearing.
- **C-10** Success-panel badge: **solid `--success` circle with white icon** —
  IconCircle contract is 6% tint fill; solid-fill variant is new.
- **C-11** Inline accent **text links as actions** — no component in the 21 covers
  them; base.css styles anchors, but these are `<button>`s. Needs a sanctioned
  pattern (a11y: they must remain buttons with visible focus rings).
- **C-12** Lock icon **17px** in the phone field — icon standard is 24/20/28.
  Snap to 20. (Alert 16px in the error row likewise → 20 or a sanctioned 16.)
- **C-13** Demo strings (`Demo — …`, `Restart demo`, `Back to the demo invite`,
  hard-coded code `424242`) are mockup scaffolding — must not ship.

---

## 5. STATES & INTERACTIONS (per step, from the DCLogic in InviteFlow)

State machine: `invite → otp → profile → done`; `expired` is entered directly (an
expired token lands there — the demo link is just the trigger). `expired` has a
`requested` sub-state. No backwards transitions exist in the mockup.

### Invite
- Static except the CTA. Phone field is **read-only by design** — no focus, no
  caret; helper explains why. `Continue` → OTP step; server sends the SMS here.
- Loading state for `Continue` (SMS dispatch) is **not designed** → OPEN Q-1.

### OTP
- On entry: boxes cleared, error cleared, **30s resend timer starts**, box 1 is
  auto-focused after ~60ms (post-mount).
- Each box: `inputmode="numeric" maxlength=1`; input is stripped to digits, keeps
  the **last** typed char (typing over a filled box replaces it); any edit clears
  the error state.
- Auto-advance to the next box on entry; **Backspace on an empty box** moves focus
  back one and clears that previous box (single keypress).
- **Paste** (any box): digits only, up to 6, fills from box 1, focuses the box after
  the last filled (or box 6); auto-verifies if 6 arrived.
- **Auto-verify** ~140ms after the 6th digit (no submit button). Wrong code →
  error: all six boxes get the inset 1.5px `--danger` ring over `--e1`, digit colour
  `--danger`, error row appears. Correct → timer stops, advance to Profile.
- Box visual states (box-shadow, 160ms transition — C-8): rest `--e1` · filled
  `--e2` · focused `--e2 + 0 0 0 2px --surface + 0 0 0 4px --accent` (the DS
  double-ring) · error overrides all.
- **Resend**: disabled while `secondsLeft > 0` showing `Resend code in 0:SS`
  (mono countdown, ticks 1s); at 0 becomes the accent link. Clicking resends,
  clears boxes+error, restarts 30s, refocuses box 1. No cap on resends in mockup.
- **Call-me escalation**: after **2 resends** (`resendCount >= 2`) the card appears;
  clicking `Call me with the code instead` swaps the card copy to
  `Calling ⟨phone⟩ now with your code.` (one-way, per OTP session; resets on
  re-entering the step).
- Verifying/loading state (network) is **not designed** → OPEN Q-1. Countdown label
  format is `0:SS` — assumes cooldown < 60s always.

### Profile
- Photo: circle button opens the native file picker (`image/png,image/jpeg` only —
  other types silently ignored in mockup). Selecting reads a data-URL preview.
  With a photo: label becomes `Change photo` and `Remove photo` appears (clears it).
  Without: `Optional` caption.
- Name: focus ring on the *wrapper* (`--e2` + double ring, 200ms). **Enter submits**
  when non-blank. CTA `disabled` while `name.trim() === ''` — no error messaging,
  purely disabled-until-valid.
- Submit → Done. Upload/saving progress **not designed** → OPEN Q-1/Q-6.

### Expired
- `notRequested`: primary CTA. Click → `requested`: CTA is **replaced** by the
  success confirmation panel (no undo, no repeat-request affordance).
- No error/failed-request state designed.

### Done
- Static confirmation. Personalized with first name (first whitespace-separated
  token of the trimmed name). Production exit → OPEN Q-8.

### Focus order & keyboard
- Invite: `Continue` is the only tab stop (demo link excluded). Locked field must
  not be focusable.
- OTP: boxes 1–6 in order → resend link (when enabled) → call-me link (when shown).
  Programmatic focus moves must not trap; each box needs an accessible name
  ("Digit N of 6") and the group a label; error row should be `role="alert"`;
  countdown `aria-live="polite"` (announce sparingly, not every second).
- Profile: photo button → photo action link(s) → name input → CTA.
- All actions keyboard-operable; focus visible (accent double-ring) everywhere;
  44px minimum targets — the 14px text links need padded hit areas (mockup renders
  them bare → part of C-11).

### Motion summary
- Step mount: fade+rise 8px, 320ms `--ease-enter`.
- Bloom: 8s ambient loop (reduced-motion: off; rise: off).
- OTP box shadow 160ms (C-8 → snap to scale); name-field focus 200ms
  `--ease-standard`.
- No exit animations; steps replace instantly then the new step rises.

### Missing states (DoD requires, mockup omits)
Loading (SMS send, verify, re-request, join/submit), offline (OfflineBanner
placement), server-error (network failure vs wrong-code), and the four-states rule
generally. These must be designed in-slice and logged in docs/13 if novel.

---

## 6. NAVIGATION

- **Entry**: invite deep link — host path `app.heliogrid.in/join` (desktop chrome
  shows it; token presumably a query/path param → OPEN Q-3). Opened from an SMS/
  WhatsApp invite message. Same URL serves the expired state when the token is dead.
  Mobile app: should deep-link into the same flow in-app (bare RN linking) →
  OPEN Q-3.
- **Exits**:
  - Done → the app proper; copy promises My Day ("Here's your day"). Mechanism
    (auto-redirect vs CTA) undefined → OPEN Q-8.
  - Expired → dead end by design: request-again then close the page; the new link
    re-enters the flow.
- **Back behaviour**: no in-UI back anywhere. Browser back from OTP/Profile is
  undefined → OPEN Q-2. Nested-screen back-‹ chrome is deliberately absent
  (onboarding, not an app screen).
- **No cross-links**: no "Sign in instead", no "Create a company" — the invite is a
  closed funnel (correct: the number is pinned to the invite).
- Wiring (no-orphan rule): this surface is reached from the invite message sent by
  TeamRoles; the re-request pings the inviter (notification surface exists in
  NotificationsCentre → verify in that slice).

---

## 7. ICONS (Lucide, outlined, 1.5px stroke — mockup inlines match)

| Use | Lucide name | Size in mockup |
|---|---|---|
| Company card | `building-2` | 20 |
| Locked phone field | `lock` | 17 (→ 20, C-12) |
| OTP error | `circle-alert` (AlertCircle) | 16 (→ 20/16 ruling, C-12) |
| Call-me card | `phone` | 20 |
| Photo placeholder | `camera` | 30 |
| Expired | `clock` | 28 |
| Success panel check | `check` | 18 (2.4 stroke — heavier than standard) |
| Done check | `check` | 30 (1.8 stroke) |

(Status-bar/browser glyphs in InviteLanding are frame chrome, not product icons.)
Bundle locally; check stroke on the two checks — mockup uses 2.4/1.8, standard is
1.5 → minor ruling.

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **Loading/offline/error states are entirely undesigned** — SMS dispatch on
   `Continue`, OTP verify round-trip, re-request send, profile submit (photo
   upload!). Four-states DoD requires these; design in-slice, log in docs/13.
2. **Back behaviour**: browser back from OTP/Profile — restart, resume, or block?
   No in-UI back; is that final on desktop too?
3. **Deep-link contract**: token shape (`/join?token=…` or `/join/:token`), token in
   URL vs session after first hit, behaviour when the link is opened on a device
   without the app vs with it (universal link handoff), and when the user is
   *already signed in* (as themselves, or as a member of another tenant).
4. **OTP hardening**: max verify attempts / lockout, resend cap (mockup is
   unlimited), timer reset policy (fixed 30s vs backoff), call-me availability
   (Exotel dependency) and whether call-me is once-only.
5. **Wrong-number escape hatch**: the number is locked "so it can't be changed" —
   if the invitee's actual SIM differs, the only path is asking the inviter to
   re-invite. Intentional? No copy covers it.
6. **Photo pipeline**: crop/zoom UI? size limit? upload timing (on select vs on
   submit), storage (Tigris presigned), failure fallback (join without photo?).
7. **Name validation**: max length, allowed scripts (Devanagari must work),
   whitespace-only guarded (trim ✓) — server-side rules unspecified. `there`
   fallback for firstName should be unreachable in production.
8. **Done exit**: auto-redirect after N seconds, or a CTA (mockup has neither —
   only the demo restart)? Which surface on web (My Day equivalent/dashboard) vs
   mobile (My Day)?
9. **Role visibility**: the inviter assigned a role (TeamRoles); should the invite
   or done step show it ("joining as Surveyor")? Mockup omits it.
10. **Locale of this surface**: per-user language is chosen *after* joining
    (ProfilePreferences); what language does the invite render in — device locale,
    inviter's choice at send time, or a picker?
11. **Inviter-name emphasis**: the h1 wraps the inviter name in a `--text-primary`
    span identical to surrounding text — dead markup or intended emphasis (e.g.
    500 weight)? Pick one.
12. **Expired re-request**: repeatable? persisted (revisit shows "request sent")?
    rate-limited? failure state?
13. **companyInitial/tile** when the tenant has a logo (BusinessProfile uploads
    one): should the tile show the logo instead of the initial?
14. **`justify-content: safe center`** needs a cross-browser check (Safari support)
    — fallback: `margin:auto` column.
15. **Resend countdown format** `0:SS` breaks if cooldown ≥ 60s — confirm 30s is
    the product value everywhere (LoginFlow parity).
