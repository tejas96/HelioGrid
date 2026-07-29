# SignUp — implementation spec (UX-master lens, auth module)

Source mockups (read in full, 2026-07-26):
- `design/mockups/SignUp.dc.html` — canvas wrapper: renders BOTH viewports (375 phone frame, 1440 browser frame) of the same `SignUpFlow` component.
- `design/mockups/SignUpFlow.dc.html` — the actual surface + interaction logic (variants `mobile` / `desktop`; steps `form` → `registered` | `done`).

Component APIs verified against `packages/ui/src` (the implemented 21-component `_ds` library) and tokens against `design/ds-source/tokens/*.css`.

---

## 1. PURPOSE + place in the auth journey

**Purpose:** company-owner self-serve signup — creates the tenant (company) AND the first user in one four-field form. Deliberately minimal: "GSTIN, logo, address and team are deliberately left for later" (wrapper copy). Phone number is the identity ("This becomes your login — we'll text a code, no password") → Better Auth + MSG91 phone-OTP (docs/spikes/S1).

**Journey position:**

```
Marketing / direct URL ──► /signup (this surface)
Login "New company? Create an account" ──► /signup
/signup Continue ──► [OTP verify — NOT in mockup, see §8-Q1] ──► done ("Welcome, {firstName}")
done ──► "tell us what you sell" ⇒ catalog/price-book onboarding (CatalogPriceBook mockup)
already-registered phone ──► "Sign in instead" ──► Login
```

This is the **tenant-creation** path. Team members never come here — they join via InviteLanding/InviteFlow. Pre-auth surface: no sidebar, no bottom nav, no header.

---

## 2. LAYOUT

Single centered column over the app canvas with an ambient brand bloom. Density: **expressive** (pill buttons, tall fields, atmosphere).

**Shared structure (both viewports):**
- Root: full-bleed `var(--canvas)` (#F6F7F9), `overflow:hidden` on the frame.
- **Bloom layer** (atmosphere, behind content, `pointer-events:none`): circle of `var(--glow-brand)` centered on the horizontal midline, bleeding off the top edge. Mobile: 520×520 at `top:-150px`; desktop: 860×860 at `top:-180px`. Animates `hg-bloom` 8s infinite (`scale 1→1.09`, `opacity .85→1`, `var(--ease-standard)`). Killed by `prefers-reduced-motion`. Same pattern as the EmptyState `--glow-brand` bloom already in `packages/ui`.
- **Scroll container**: flex column, `align-items:center; justify-content:safe center; overflow-y:auto` — content vertically centered but never clipped on short viewports (the `safe` keyword matters at 375×667-class heights and with keyboard open).
- **Content column**: `width:100%`.
  - Mobile (375): `padding-inline:26px`, `padding-block:20px`, `max-width:620px`.
  - Desktop (1440): `padding-inline:56px`, `padding-block:0`, `max-width:400px` (deliberately *narrower* than mobile max — a tight single column floating on the big canvas; no card, no split-pane).
- **Wordmark** first: "Helio**Grid**" — 22px/700/−0.02em; "Helio" in `--text-primary`, "Grid" filled with `--gradient-brand` via background-clip text. `margin-bottom:32px`. (Iridescence as brand atmosphere — sanctioned.)
- No Card component anywhere — content sits directly on canvas; fields carry their own e1 elevation.

**Vertical rhythm (form step):** wordmark →32→ h1 →10→ intro →26→ fields (gap 16; label→field gap 7; field→helper gap 7) →24→ Continue →16→ reassurance row →14→ sign-in row →22→ demo note. Registered step: icon →20→ h1 →10→ body →24→ buttons (gap 12). Done step: icon →22→ h1 →10→ body →26→ restart link.

**Device chrome in SignUp.dc.html** (iOS status bar "9:41", home indicator, browser traffic-lights + `app.heliogrid.in/signup` URL pill) is mockup harness, not product UI — do not build.

---

## 3. EXACT COPY (verbatim; `{…}` = dynamic)

**Step 1 — form**
| Element | String |
|---|---|
| H1 | `Create your account` |
| Intro | `Four quick details and you're in. Everything else — GST, logo, your team — comes later, when you need it.` (max-width 38ch) |
| Label 1 | `Your name` — placeholder `e.g. Rajesh Patil` |
| Label 2 | `Company name` — placeholder `e.g. Suryodaya Solar` |
| Label 3 | `City` — placeholder `e.g. Pune` |
| Label 4 | `Phone number` — prefix `+91` — placeholder `98765 43210` |
| Phone helper | `This becomes your login — we'll text a code, no password.` |
| Primary CTA | `Continue` |
| Reassurance (✓ icon) | `Free to try. No card needed.` |
| Sign-in row | `Already have an account? ` + link `Sign in` |
| Demo note (mockup-only, do NOT ship) | `Demo — enter 98765 43210 to see the already-registered path.` |

**Step 2 — already registered**
| Element | String |
|---|---|
| H1 | `This number already has an account` |
| Body | `+91 {phoneFormatted} is already registered. Sign in to pick up where you left off, or use a different number to create a new company.` — `{phoneFormatted}` = 10 digits grouped `XXXXX XXXXX`, rendered `--text-primary`/500/`white-space:nowrap` |
| Primary CTA (link) | `Sign in instead` |
| Text button | `Use a different number` |

**Step 3 — done**
| Element | String |
|---|---|
| H1 | `Welcome, {firstName}` — first whitespace-separated word of "Your name"; mockup fallback `there` |
| Body | `Your account for {company} is ready. Next, tell us what you sell.` — `{company}` rendered `--text-primary`/500; mockup fallback `your company` |
| Text button (mockup-only, do NOT ship) | `Restart demo` |

All copy is English sentence-case; buttons are verbs/phrases (no "Submit"). No Hindi/Marathi strings provided — all of the above must enter the Lingui catalog; `+91`, phone digits and `{phoneFormatted}` are never translated and render in `--font-mono`.

---

## 4. COMPONENT MAP (against the implemented `packages/ui` `_ds` API)

| Mockup element | `_ds` component + props | Notes / conflicts |
|---|---|---|
| Wordmark | **none — composition** | Typography + `--gradient-brand` text-clip on "Grid". Candidate shared `<Wordmark>` piece (Login uses the identical block) — compose, don't add a 22nd component; if reused ≥2×, register in docs/13. |
| Bloom layer | **none — composition** | Absolutely-positioned div with `--glow-brand`; mirror of the EmptyState bloom pattern. RN: react-native-svg radial (already solved for EmptyState). |
| H1 / intro / body copy | tokens only | See §8-CONFLICTS for off-scale sizes. |
| Name / Company / City fields | `Input` `density="expressive"` `label` `placeholder` | **CONFLICT (mockup drift):** mockup field = 56px tall, radius 16, pad 18, control 16px. Implemented `Input` (the law) = 52px, `--r-input-expressive` 14px, pad `--sp-4` 16, control `--fs-body` 15px. Build with the implemented Input; do not fork. (16px mockup font smells like the iOS-Safari anti-zoom heuristic — if zoom-on-focus appears in the field, fix at the Input-component level, not per-screen.) |
| Phone field | `Input` `label="Phone number"` `mono` `inputMode="tel"` `helper` `leading={<span>+91</span>}` | Leading `+91` = mono/700/`--text-secondary`. **CONFLICT:** mockup phone text 18px + 0.14em tracking is off the type scale and off the Input API — accept Input's `mono` 15px rendering, or extend Input deliberately (see §8-Q13). |
| Continue | `Button` `variant="primary"` `size="lg"` `fullWidth` `loading={loading}` `disabled={continueDisabled}` | Matches implemented Button exactly (48px, pill, near-black). |
| ✓ reassurance row | **none — composition** | Inline Lucide `check` (15px, `--success` stroke) + 13px `--text-secondary` text. **CONFLICT:** mockup 13.5px → use `--fs-body-sm` 13px. |
| `Sign in` link | plain `<a>`/router link, `--link` token | Standard accent link, weight 500. |
| Registered avatar-circle | `IconCircle` `icon={<User/>}` `color="var(--info)"` `size={56}` | Explicit `size` prop exists. Verify IconCircle's tint (6% color-mix) vs mockup's `--info-bg` #EAF2FE — if visibly different, IconCircle wins. |
| `Sign in instead` | `Button` `variant="primary"` `size="lg"` `fullWidth` **as navigation** | **Composition needed:** mockup is an `<a>` styled as the primary button (raw `#fff` text hex in mockup). Implemented Button renders `<button>` — wrap with router navigation (onClick → router.push) or add an approved anchor rendering; do NOT hand-style an anchor in app code. |
| `Use a different number` / `Restart demo` | `Button` `variant="ghost"` (`size="md"`) | Mockup is a bare 44px accent text-button, 14px. Ghost Button is the vocabulary match; accept its 15px/pill rendering. |
| Done check-circle | `IconCircle` `icon={<Check/>}` `color="var(--success)"` `size={64}` | Same tint caveat as above. |
| Field focus treatment | built into `Input` | Mockup ring `var(--e2), 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)` = exactly the DS borderless-input focus law — already inside Input.css. |

**Not used:** Card, Chip, Badge, StatusChip, SegmentedControl, Tabs, ListRow, StatCard, Avatar/AvatarGroup, Checkbox, Radio, Switch, ProgressBar, Toast, OfflineBanner, EmptyState, IconButton.

**Raw values in the mockup that are NOT derivable from tokens (CONFLICT register):**
1. Field metrics 56px / radius 16 / pad 18 / font 16 (vs Input 52/14/16/15) — implemented Input wins.
2. Phone text 18px, tracking 0.14em / 0.02em — off scale.
3. H1 30px (form/done) and 28px (registered) — scale has h1 32 / h2 24. Pick `--fs-h1` 32/36 (desktop) — or an owner ruling; do not inline 30px.
4. 13.5px reassurance, 13px labels are fine (`--fs-body-sm`).
5. Spacing values 7, 10, 14, 18, 22, 26 are off the 4px scale (0/2/4/8/12/16/20/24/32…) — snap to 8/12/16/20/24 equivalents.
6. `#fff` text on the sign-in-instead anchor — must come from Button/`--text-inverse` alias, never inline.
7. Icon strokes 1.6 / 1.8 in mockup vs Lucide standard 1.5px — use 1.5.
8. Wrapper-file paddings (56/64/80, radius 46/20) are harness chrome — ignore.

---

## 5. STATES & INTERACTIONS

**Machine:** `step ∈ {form, registered, done}`; plus `focused` (per-field), `loading`.

**Step `form`:**
- Field state: rest (e1) → focus (e2 + 2px surface + 4px accent double ring, transition 200ms `--ease-standard`) → blur back. Only one field focused at a time.
- Phone input sanitising: `value.replace(/\D/g,'').slice(0,10)` — digits only, hard cap 10. **Mockup bug to fix in production:** pasting `+91 98765 43210` yields `9198765432` (country code swallowed, number truncated wrong). Strip a leading `91`/`+91`/`0` before the 10-digit slice.
- Validation = gating only, no error messages: `continueDisabled = !name.trim() || !company.trim() || !city.trim() || phone.length !== 10 || loading`. No per-field error copy exists in the mockup (see §8-Q2).
- Enter key inside the phone field submits (`onKeyDown` → submit). Submit re-checks the guard.
- Submit → `loading:true` → Button spinner state (700ms simulated) → branch: phone already registered → `registered`; else → `done`. Real implementation: this is where the OTP send + verify must be inserted (§8-Q1) and where the phone-exists lookup happens server-side.
- Loading: Button `loading` (built-in spinner); fields are NOT disabled in the mockup while loading (decide: disable them — recommended).
- Empty state: n/a (the form is the empty state). Error / offline states: **absent from mockup — must be designed** (DoD requires all four; register in docs/13). Recommended: `Input error` prop for field issues, `Toast variant="error"` + inline retry for network failure, `OfflineBanner` if applicable on web.
- Focus order: Name → Company → City → Phone → Continue → "Sign in" link. No autofocus specified (§8-Q6).

**Step `registered`:**
- Entered when submitted phone matches an existing account. Shows the number back (`+91 XXXXX XXXXX`, mono-adjacent, nowrap).
- `Sign in instead` → Login surface (prefill phone? §8-Q5).
- `Use a different number` → back to `form`, **clears `phone` only** — name/company/city preserved, `focused` reset. No other back affordance.
- Focus order: Sign in instead → Use a different number.

**Step `done`:**
- Success circle + personalised copy. Mockup's only action is demo-restart; production needs a real forward CTA or auto-redirect into onboarding ("tell us what you sell") — undefined (§8-Q4).

**Motion:**
- Every step mount: `.hg-rise` — fade + rise 8px, **320ms `--ease-enter`** (= `--dur-emphasised`). Steps swap (no slide/crossfade of the outgoing step).
- Bloom pulse 8s ambient loop.
- `prefers-reduced-motion: reduce` → both animations off (DS collapses durations to 1ms).
- Button press scale 0.97 (from Button component).

**Timers:** none in this surface (no OTP resend countdown here — that lives in LoginFlow's OTP step: 30s countdown, "Resend code", call-me fallback — reuse it when the signup OTP step is added). The 700ms delay is demo simulation only.

**Keyboard/a11y:** all controls are native input/button/a — tab-operable; `label for`/`id` pairing on phone (Input component does this via `useId` for all fields); Enter submits from phone field; targets ≥44px throughout (48px CTA, 44px text-button, 52px fields). Icons are decorative (`aria-hidden`); the registered/done h1s announce the state change — move focus to the h1 on step change (mockup silent on this; do it).

---

## 6. NAVIGATION

- **Entry points:** direct URL `app.heliogrid.in/signup` (browser-chrome pill in the wrapper — deep-linkable, unauthenticated); Login screen footer link "New company? Create an account" (`LoginFlow.dc.html`).
- **Exits:** "Sign in" (form footer) → Login. "Sign in instead" (registered) → Login. Done → catalog onboarding (implied by copy; route undefined §8-Q4).
- **Back behaviour:** no in-surface back chevron; browser back = leave signup. Registered→form via "Use a different number" (phone cleared, rest kept). Pre-auth: no bottom nav / no app chrome on mobile.
- **Guards:** already-authenticated visitors hitting /signup should redirect to the app (not specified — standard practice, §8-Q7).
- **RN:** SignUp ships in the **same slice** as web (Law 7 lockstep, owner ruling 2026-07-27).
  Field-app entry remains Sign in + invite accept; new company creation is native parity
  with web `/signup`, verified on both simulators.

---

## 7. ICONS (Lucide, 1.5px stroke, round caps/joins)

| Where | Lucide name | Mockup size/stroke |
|---|---|---|
| "Free to try" row + done circle | `check` | 15px/1.6 and 30px/1.8 → normalise to 1.5 stroke |
| Registered circle | `user` | 26px/1.5 |
| Browser URL pill (harness only) | `lock` | not product UI |
| iOS status bar glyphs (harness only) | — | not product UI |

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **OTP step is missing.** Helper copy promises "we'll text a code, no password", yet the flow jumps form → done with no verification screen. Production must insert send-OTP + "Enter your code" (presumably reusing LoginFlow's 6-box OTP step + 30s resend + call fallback, per S1 Better Auth+MSG91). Does signup share the Login OTP screen or get its own? Where does "already registered" branch — at pre-OTP lookup (as mocked) or after OTP?
2. **No error states defined**: invalid/short phone on submit-attempt, server failure, rate-limit (429), duplicate company name — zero error copy exists. Needs design + docs/13 row.
3. **Offline/degraded state** undefined (DoD requires it even on web).
4. **Done-step forward path**: "tell us what you sell" implies catalog/price-book onboarding, but there's no CTA and no route. Auto-redirect after n seconds? Button? Undefined.
5. Should "Sign in instead" **prefill the phone** on the Login screen? Strongly implied UX win, not specified.
6. **Autofocus** on "Your name" at mount? Not specified (desktop yes / mobile no is the usual ruling — keyboard jump on load).
7. **Authenticated-user redirect** away from /signup: not specified.
8. **RN parity ruling needed**: is signup formally web-only (Law 7 exception), or must a native/webview signup ship?
9. **Terms/privacy consent** absent — no checkbox, no legal line. Deliberate? (Billing exists in v1; some consent line is normal.)
10. **Language**: per-user language is D25, but signup has no locale switcher and no Hindi/Marathi copy. What locale does the pre-auth surface use, and is the first user's language captured here?
11. **What does City feed** — tenant HQ, default site city, DISCOM inference? Free text with no autocomplete; server contract undefined.
12. **Phone-exists disclosure** is an intentional UX (account-enumeration surface). Confirm acceptable + specify rate limiting on the lookup (apps/api/CLAUDE.md: aggressive limits on public endpoints).
13. **Phone field typography**: keep Input's `mono` 15px, or bless a larger "hero numeric input" extension (mockup 18px/0.14em; LoginFlow uses the same style)? Needs one ruling shared with Login.
14. Mockup's `phoneFormatted` groups `5+5` (`98765 43210`) — confirm as the canonical Indian mobile display grouping everywhere.
15. Off-scale type/spacing values (§4 conflicts): snap-to-token decisions needed once, shared with the Login spec (identical drift there).
16. "Use a different number" preserving name/company/city (only phone cleared) — confirm intended.
17. `firstName`/`company` fallbacks ("there" / "your company") are unreachable when validation holds — drop or keep as defensive copy?
