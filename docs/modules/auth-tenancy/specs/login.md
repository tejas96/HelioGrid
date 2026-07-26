# Login — implementation spec (UX-master lens)

Source mockups (read in full, binding by name):
- `design/mockups/Login.dc.html` — canvas frame page: 375×812 phone shell + 1440×900 browser shell, both embedding `LoginFlow`.
- `design/mockups/LoginFlow.dc.html` — the interactive surface itself, `variant: 'mobile' | 'desktop'`, three steps: `phone → otp → done`.

Related mockups: `SignUp.dc.html` / `SignUpFlow.dc.html` (linked from step 1), `MyDay.dc.html` (implied destination).

---

## 1. PURPOSE + place in the auth journey

**Journey stage 1** (the frame page labels it "Login · Journey stage 1"). Passwordless phone-OTP
sign-in for existing users of an existing tenant: enter a +91 mobile number → receive a 6-digit
SMS code (MSG91 per stack) → verify → land in the app ("Taking you to your day" ⇒ My Day).

- It is the unauthenticated gate for `app.heliogrid.in/login` (URL shown verbatim in the desktop
  browser chrome).
- It hands off to **Sign up** ("New company? Create an account") for new tenants — a separate
  surface (`SignUp.dc.html`), not a mode of this screen.
- Fallback channel: after two SMS resends a **voice-call delivery** option appears ("Call me with
  the code instead") — maps to the Exotel voice stack.
- No password, no email, no username anywhere. No "remember me", no SSO.

---

## 2. LAYOUT

### Shared structure (both variants)

Single centered column floating on the page canvas — **no card around the form**; the form sits
directly on `--canvas` and separates by nothing (the whole viewport is the surface). Density:
**expressive** (generous rhythm, radius-16 field, pill button).

Layer stack, back to front:
1. **Canvas**: full-bleed `var(--canvas)` (#F6F7F9), `overflow:hidden` on the root.
2. **Brand bloom** (atmosphere, never information): a `--glow-brand` radial disc, horizontally
   centered, bleeding off the top edge. Mobile: 520×520 at `top:-150px`. Desktop: 860×860 at
   `top:-180px`. Animates `hg-bloom`: scale 1→1.09, opacity 0.85→1, 8s infinite,
   `--ease-standard`; `pointer-events:none`; disabled under `prefers-reduced-motion`.
3. **Content scroller**: full-size flex column, `align-items:center`,
   `justify-content:safe center` (keyboard-safe vertical centering — content tops out instead of
   clipping when the soft keyboard shrinks the viewport), `overflow-y:auto`, horizontal padding
   `padX` (mobile 26px, desktop 56px — see CONFLICTS).
4. **Column**: `width:100%; max-width:colMax` — **mobile 620px** (i.e. effectively full-width at
   375: 375 − 2×26 = 323px), **desktop 400px** (narrow focused column centered in 1440; no
   split-panel, no marketing pane).

Column contents top-to-bottom:
- **Wordmark** "HelioGrid": 22px / 700 / −0.02em / line-height 1. "Helio" in `--text-primary`;
  "Grid" filled with `--gradient-brand` via background-clip:text (sanctioned iridescence-as-
  atmosphere). `margin-bottom: 36px`.
- **Step body** (one of three, below). Each step body mounts with `hg-rise`: fade + 8px rise,
  320ms (`--dur-emphasised`) `--ease-enter` — the DS card-mount motion applied to the whole step.

### Step 1 — phone (`isPhone`)

- `h1` "Welcome back" — 30px / 700 / −0.025em / 1.1 (see CONFLICTS: off type scale).
- Body paragraph, 15px/1.5 `--text-secondary`, `max-width:36ch`.
- Field group (`margin-top:28px`, internal `gap:7px`):
  - Label "Mobile number" — 13px / 500 / `--text-secondary`, `for`-bound to the input.
  - **Phone field**: borderless elevated well — flex row, height 56px, padding 0 18px, gap 12px,
    `background:var(--surface)`, `border-radius:16px` (`--r-md`), rest shadow `--e1`, focus
    shadow `var(--e2), 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)` (the exact DS
    borderless-input focus recipe), shadow transition 200ms `--ease-standard`.
    - Fixed prefix `+91` — `--font-mono` 18px / 700 / `--text-secondary` / 0.02em, non-editable.
    - Input — `--font-mono` 18px, letter-spacing 0.14em, `tabular-nums`, `inputmode="tel"`,
      placeholder `98765 43210`, transparent, borderless.
  - Helper "Sent by SMS to your registered number." — 12px `--text-tertiary`.
- **Continue button** (`margin-top:22px`): `_ds` Button `variant="primary" size="lg"`
  `fullWidth loading disabled` — near-black pill, 48px, full column width.
- Footer (`margin-top:22px`, centered, 14px `--text-secondary`):
  "New company? " + accent link "Create an account" (500 weight).

### Step 2 — OTP (`isOtp`)

- `h1` "Enter your code" — same 30px style.
- Paragraph 15px/1.5 `--text-secondary`: "Enter the 6-digit code sent to **+91 {phoneFormatted}**."
  — the number is `--text-primary` / 500 / `white-space:nowrap`; formatted `NNNNN NNNNN` (5+5).
- **"Change number"** — inline accent text-button, 14px/500, self-start, `margin-top:8px`.
- **OTP boxes** (`margin-top:26px`, row `gap:10px`, exactly 6):
  - Mobile 46×54 px, font 22px; desktop 54×62 px, font 26px. `border-radius:14px`
    (`--r-input-expressive`), `background:var(--surface)`, `--font-mono` 700 `tabular-nums`,
    text centered, `inputmode="numeric" maxlength="1"`.
  - Shadow ladder (transition `box-shadow 160ms` — see CONFLICTS):
    - rest/empty → `--e1`
    - filled → `--e2`
    - focused → `var(--e2), 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)`
    - error → `inset 0 0 0 1.5px var(--danger), var(--e1)` + digit colour `--danger`
      (exact DS error-field recipe; error styling applies to ALL six boxes at once).
- **Error row** (only when `otpError`; `margin-top:14px`, gap 7): 16px `circle-alert` icon +
  "That code doesn't match. Check it and try again." — 13px / 500 / `--danger`.
- **Resend row** (`margin-top:22px`, 14px):
  - countdown running → `--text-tertiary` text "Resend code in `0:SS`" (seconds label in
    `--font-mono` `tabular-nums`).
  - countdown done → accent text-button "Resend code".
- **Call-me card** (only after 2 resends; `margin-top:18px`): `--surface` card, radius 16px
  (`--r-md`), `--e1`, padding 16px 18px, row gap 14 —
  - IconCircle 40px, `--accent-subtle` fill, `--accent` `phone` icon (20px / 1.5 stroke).
  - Body (13.5px `--text-secondary` — see CONFLICTS), two sub-states:
    - not yet requested: "Still no code after two tries?" + accent text-button (14px/500)
      "Call me with the code instead".
    - requested: "Calling **+91 {phoneFormatted}** now with your code. Keep the phone nearby."
      (number `--text-primary`/500/nowrap). Card stays; no further action.
- Demo caption (`margin-top:26px`, 12px `--text-tertiary`) — **mockup-only**, do not ship.

### Step 3 — done (`isDone`)

- Success disc: 64px circle, `--success-bg` fill, `check` icon 30px / 1.8 stroke / `--success`.
- `h1` "You're signed in" (`margin-top:22px`, same 30px style).
- Paragraph "Welcome back. Taking you to your day." — 15px/1.5 `--text-secondary`.
- "Restart demo" text-button — **mockup-only**; production replaces this step's dwell with an
  automatic redirect (see NAVIGATION).

### Frame chrome (Login.dc.html — presentation only, never shipped)

Phone shell: 46px status bar (9:41, signal/wifi/battery glyphs), 375×812, radius 46, home
indicator. Desktop shell: 48px `--surface-alt` browser bar, traffic lights, pill URL chip with
`lock` icon + `app.heliogrid.in/login` in mono 12.5px. All non-product.

---

## 3. EXACT COPY (verbatim; `{…}` = dynamic)

| # | String | Where | Notes |
|---|--------|-------|-------|
| 1 | `HelioGrid` | wordmark | "Grid" gradient-clipped; brand — never translated |
| 2 | `Welcome back` | step 1 h1 | |
| 3 | `Sign in with your phone number. No password — we'll text you a one-time code.` | step 1 body | em-dash |
| 4 | `Mobile number` | field label | |
| 5 | `+91` | field prefix | static in v1 |
| 6 | `98765 43210` | input placeholder | 5+5 grouping |
| 7 | `Sent by SMS to your registered number.` | field helper | |
| 8 | `Continue` | primary button | verb-first per DS law |
| 9 | `New company? ` | footer text | trailing space before link |
| 10 | `Create an account` | footer link | → Sign up |
| 11 | `Enter your code` | step 2 h1 | |
| 12 | `Enter the 6-digit code sent to +91 {phoneFormatted}.` | step 2 body | `{phoneFormatted}` = `NNNNN NNNNN` |
| 13 | `Change number` | text-button | |
| 14 | `That code doesn't match. Check it and try again.` | error line | apostrophe is `'` typographic in source |
| 15 | `Resend code` | text-button (enabled) | |
| 16 | `Resend code in {0:SS}` | countdown | `{0:SS}` mono tabular, e.g. `0:30` … `0:01` |
| 17 | `Still no code after two tries?` | call card | |
| 18 | `Call me with the code instead` | call card text-button | |
| 19 | `Calling +91 {phoneFormatted} now with your code. Keep the phone nearby.` | call card (requested) | |
| 20 | `You're signed in` | step 3 h1 | |
| 21 | `Welcome back. Taking you to your day.` | step 3 body | |

Mockup-only (never ship): `Demo — the code is 424242. Type anything else to see the error
state.`, `Restart demo`, all Login.dc.html frame copy (`Login · Journey stage 1`, `Sign in`,
explainer paragraph, `Mobile`, `375 px`, `Desktop`, `1440 px`, `9:41`,
`app.heliogrid.in/login`).

Language: **English only** in the mockup. All 21 strings go through the Lingui catalog
(`t`/`<Trans>`); Hindi + Marathi renders must be verified per i18n rule (≈20–30% expansion —
the 36ch body cap and the call-me card are the tight spots). `+91`, digits, and the countdown
never translate; `{phoneFormatted}` uses the 5+5 grouping in every locale.

---

## 4. COMPONENT MAP (→ the 21-component `_ds` API)

| Mockup element | `_ds` component | Props / notes |
|---|---|---|
| Continue | **Button** | `variant="primary" size="lg" fullWidth loading={sending} disabled={phone.length!==10 || sending}` — the mockup literally instantiates `HelioGridDesignSystem_c8aa43.Button`; clean 1:1 |
| Phone field | **Input** | `label="Mobile number"` `helper="Sent by SMS…"` `mono` `leading={<span>+91</span>}` `inputMode="tel"` `placeholder="98765 43210"` `density="expressive"` — implemented Input already has `leading`/`mono`/`helper`; **metrics differ from mockup** (see CONFLICTS C1) |
| Call-me card | **Card** | expressive surface card; mockup radius 16 = `--r-md`, not `--r-card-expressive` 24 (CONFLICT C6) |
| Call-me icon disc | **IconCircle** | 40px expressive, `--accent-subtle` tint, accent `phone` icon — clean 1:1 |
| OTP boxes | — **composition** | No `_ds` OTP component. Build a screen-local `OtpInput` from six single-char inputs reusing the Input shadow/focus/error recipes + tokens. Do NOT add it to the 21 without an owner ruling |
| Text-links ("Change number", "Resend code", "Call me…", "Create an account") | — **composition** | No `_ds` Link/TextButton. Not Button `ghost` (pill, 32px min — wrong shape for inline prose links). Compose: accent 14px/500 text button, 2px accent focus ring, ≥44px hit area via padding/negative margin |
| Success disc | — **composition** | 64px disc exceeds IconCircle's 40/32 sizes; compose from tokens (`--success-bg`/`--success`) or extend IconCircle with an owner-approved size |
| Wordmark | — **composition** | text + `--gradient-brand` clip; make it a shared `Wordmark` atom (auth screens + app shell will reuse) |
| Brand bloom | — **composition** | `--glow-brand` radial layer; same pattern as the EmptyState bloom already ratified (2026-07-26 commit) — reuse that approach |
| Error line | — **composition** | icon + `--danger` 13px text; not Toast (inline, persistent, tied to field), not StatusChip (not a status) |
| Countdown text | — **composition** | plain text, mono `tabular-nums` for `0:SS` |

Not used on this surface: Checkbox, Radio, Switch, Chip, Badge, Avatar, AvatarGroup, ListRow,
StatCard, StatusChip, EmptyState, ProgressBar, Toast, SegmentedControl, Tabs, IconButton,
OfflineBanner (but see Q1 — OfflineBanner is the natural vehicle for the missing offline state).

### CONFLICTS (raw values / off-token drift — resolve before build)

- **C1 — Phone field metrics vs implemented Input**: mockup 56px tall / radius 16 / 18px mono;
  `packages/ui` Input expressive is **52px / `--r-input-expressive` 14 / `--fs-body` 15**.
  Screens must import the index, so either (a) ship the implemented Input as-is (recommended;
  library is law) or (b) get an owner ruling adding an `lg` input size at generation time.
- **C2 — `h1` 30px** is off the type scale (h1 token 32/36). Use `--fs-h1` 32 or ratify a
  30px auth-display extension. Same for the **22px wordmark** (scale has 20/24) and
  **13.5px** call-card body (scale has 13).
- **C3 — Off-scale spacing rhythm**: 7, 10, 14, 18, 22, 26, 28, 36 px gaps/margins are not on
  the 4px token scale (0/2/4/8/12/16/20/24/32/40/48/64/80/96). Snap: 7→8, 10→8 or 12, 14→16,
  18→16 or 20, 22→24, 26→24, 28→24 or 32, 36→32 or 40.
- **C4 — Screen padding**: mobile 26px / desktop 56px vs tokens `--screen-pad-mobile` 20 /
  `--screen-pad-desktop` 32. Use the tokens.
- **C5 — 160ms** OTP shadow transition is off the motion scale (120/200/320/500) — use
  `--dur-standard` 200ms. (Phone-field 200ms and step-rise 320ms already match tokens.)
- **C6 — Radius 16** on field + call-me card: exists as `--r-md`, but the card assignment
  token is `--r-card-expressive` 24. Decide: `--r-md` compact-card usage (ratify) or 24.
- **C7 — OTP box dimensions** 46×54 / 54×62, gap 10, fonts 22/26 — all component-internal
  magic numbers; ratify as marked token extensions at generation time (never inline).
- **C8 — `check` icon stroke 1.8** (and frame glyphs 1.2–1.8) vs the Lucide 1.5px standard —
  use lucide `check` at 1.5.
- Compliant (no conflict, keep exactly): focus recipe `--e2 + 0 0 0 2px surface + 0 0 0 4px
  accent`, error `inset 0 0 0 1.5px --danger`, near-black primary button, accent only on
  links/focus/selected, zero structural borders, light-only, iridescence as atmosphere only.

---

## 5. STATES & INTERACTIONS

### Step 1 — phone

| State | Trigger | Render |
|---|---|---|
| default | mount | empty field, Continue **disabled** |
| focused | field focus | focus shadow recipe, 200ms |
| partial | 1–9 digits | Continue stays disabled |
| valid | exactly 10 digits | Continue enabled |
| sending | Continue / Enter | Button `loading` (spinner), field stays editable in mockup; disable both in production while in flight |

- Input sanitation: strip non-digits, hard cap 10 (`value.replace(/\D/g,'').slice(0,10)`).
- **Enter** submits when valid. Click submits. Double-submit guarded by the loading flag.
- Mockup fakes the network with 700ms; production = real OTP-send call.
- Focus order: phone input → Continue → "Create an account". No autofocus on mount specified.

### Step 2 — OTP

Entry: boxes cleared, error cleared, resend count reset, **30s countdown starts**, box 1
auto-focused (~60ms after mount).

Box behaviour:
- Typing a digit fills the box (last-char-wins on overtype) and advances focus to the next box.
- 6th digit filled → **auto-verify after 140ms** (no submit button exists).
- **Backspace on an empty box** clears the *previous* box and focuses it (single-keystroke
  correction walk-back). Backspace on a filled box clears it natively.
- **Paste** (any box): digits only, first 6 distributed from box 1, focus lands after the last
  pasted digit, auto-verify if complete.
- Any edit/paste **clears the error state**.
- Per-box visuals: rest `--e1` → filled `--e2` → focused ring recipe → error inset danger ring
  (all six boxes + danger digits). **Wrong code keeps the digits** — user edits in place.

Timers & escalation:
- Countdown 30s: "Resend code in 0:SS" (tertiary, mono seconds) → at 0 swaps to the accent
  "Resend code" text-button.
- **Resend**: clears boxes + error, restarts the 30s countdown, refocuses box 1, increments
  the resend counter. No cap in the mockup.
- **After the 2nd resend** (`resendCount ≥ 2`) the call-me card appears (rises with the layout;
  card persists once shown). "Call me with the code instead" → swaps card body to the
  "Calling +91 …" confirmation; countdown/resend continue unaffected.
- "Change number" → back to step 1, timer stopped, boxes cleared; **entered phone is preserved**
  in the field.
- Focus order (DOM): "Change number" → box 1…6 → "Resend code" (when enabled) → "Call me…"
  (when visible). Note the auto-focus jumps into box 1 on entry.

Verification: mockup compares against `424242` locally; production verifies server-side
(Better Auth + MSG91), with in-flight/disabled states — **unmodelled in the mockup** (Q2).

### Step 3 — done

Static confirmation; mounts with the 320ms rise. Production: brief dwell → redirect to My Day
(mockup's "Restart demo" is a placeholder for the redirect).

### Motion summary

Step mount: fade + 8px rise, 320ms `--ease-enter`. Field shadows: 200ms `--ease-standard`
(OTP mockup's 160ms → snap to 200). Bloom: 8s ambient loop. `prefers-reduced-motion`: bloom
and rise off (mockup) — production also collapses durations to 1ms per token media query.

### Missing states (DoD requires all four — must be designed before build)

Loading exists (button). **Empty** is the default form. **Error** exists only for wrong-OTP.
**Offline / network-failure / server-error / rate-limit / unregistered-number states do not
exist in the mockup** — see OPEN QUESTIONS. OfflineBanner is the obvious vehicle for offline.

---

## 6. NAVIGATION

- **Entry points**: direct `app.heliogrid.in/login`; any unauthenticated hit on a protected
  route (redirect); post-logout; session expiry. RN app: the same flow as the native
  unauthenticated root (mobile variant of LoginFlow is the RN spec — lockstep rule).
- **Exits**: success → My Day ("Taking you to your day"); "Create an account" → Sign up
  (`SignUp.dc.html` flow).
- **Back behaviour**: within the flow only "Change number" (otp → phone, phone preserved).
  Browser/hardware back is undefined in the mockup (Q8). Step 3 must not be back-navigable
  into (session already established).
- **Deep links**: only `/login` is evidenced. `returnTo`/post-login redirect target is
  undefined (Q8). Never put the phone number in a URL param (privacy rule).
- No orphan-screen risk: this is the app's front door; wire the logout action and the 401
  interceptor to it in the same slice.

---

## 7. ICONS (Lucide, 1.5px stroke, round caps/joins, bundled locally)

| Use | Lucide name | Size in mockup |
|---|---|---|
| OTP error line | `circle-alert` | 16px |
| Call-me disc | `phone` | 20px (inside 40px IconCircle) |
| Success disc | `check` | 30px (mockup stroke 1.8 → use 1.5, C8) |

Frame-only (not shipped): `lock` (URL chip), status-bar signal/wifi/battery glyphs (custom
SVGs, not Lucide).

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **Offline state absent** (DoD violation as-mocked). Proposal: OfflineBanner + disabled
   Continue with explanatory helper; queueing is meaningless for OTP.
2. **Server-side failure states unmodelled**: OTP-send failure (MSG91 down), verify in-flight
   indicator, expired code, wrong-attempt lockout, 429 rate-limit. Error copy exists only for
   mismatch.
3. **Unregistered number**: mockup always advances. Real behaviour — generic "code sent" (no
   account enumeration) vs explicit "number not found → Create an account"? Security says the
   former; UX mockup is silent.
4. **Resend cap**: unlimited in mockup; call-me appears at 2 but resend continues. Product
   limit + cooldown escalation undefined.
5. **Call-me mechanics**: assumed Exotel voice OTP; retry-ability, failure state, and whether
   it restarts the countdown are undefined.
6. **`+91` hardcoded**: "India-first, global-ready" — is the country code ever selectable?
   v1 answer needed (spec assumes fixed +91).
7. **SMS autofill**: `autocomplete="one-time-code"` / WebOTP / Android SMS Retriever are not
   modelled but are table stakes for OTP UX — specify for web and RN.
8. **Back/deep-link semantics**: browser back from OTP step, `returnTo` after login,
   hardware-back on Android.
9. **Done-step dwell**: auto-redirect timing to My Day unspecified (mockup uses a demo button).
10. **Multi-tenant users**: if one phone belongs to users in multiple tenants, is there a
    tenant chooser after verify? Not shown anywhere.
11. **Error retention**: wrong code keeps digits (mockup). Confirm vs clear-on-error.
12. **Legal**: no terms/privacy line on either auth screen.
13. **C1/C2/C6/C7 rulings**: field height (52 vs 56), 30px h1, radius-16 cards, OTP box
    dimensions — need owner sign-off as token extensions or snap-to-token.
14. Provenance tiers: no user-visible numbers on this surface — rule satisfied vacuously
    (countdown/phone are user input, not computed figures).
