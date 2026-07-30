# Spec — "What do you install?" (Company onboarding, Step 1 of 2)

Source mockups (read in full, spec derived only from these + ds-source tokens):
- `/Volumes/works-space/heliogrid/design/mockups/WhatYouSell.dc.html` — canvas wrapper presenting both viewports
- `/Volumes/works-space/heliogrid/design/mockups/SellFlow.dc.html` — the interactive component (`variant: 'mobile' | 'desktop'`) with full state logic in its `DCLogic` script

Token ground truth: `/Volumes/works-space/heliogrid/design/ds-source/tokens/*.css` (radius, spacing, typography, colors, motion verified against the mockup's raw values below).

---

## 1. PURPOSE + place in the auth journey

**Purpose.** First step of company (tenant) onboarding immediately after account creation. The new EPC owner declares their install segment — **Residential rooftop / Commercial & industrial / Both** — and optionally a **typical system size (kW)**. Selection pre-fills the size with a segment default (res → 5, C&I → 50, both → 10). The answer "sets sensible defaults so your first proposal is close" — i.e. it seeds proposal/design defaults for the tenant. It is explicitly skippable ("Skip for now" → standard residential defaults).

**Journey position.**
- Entry: after `SignUpFlow` completes (Create your account → OTP → "Welcome, {name}"). Desktop chrome in the canvas shows **`app.heliogrid.in/onboarding`** behind a lock glyph — this is an authenticated web surface.
- This screen is **Step 1 of 2** (two-segment progress bar + overline). The mockup does not name step 2 (see Open Questions; siblings `YourRole`/`RoleFlow` and the finale `YoureReady`/`ReadyFlow` — "You're set up, Rajesh" … create your first lead — exist in the same mockup set).
- Exit: Continue or Skip → (in the demo) an inline "You're set up" confirmation whose closing line ("Next, create your first lead.") matches `ReadyFlow`'s call to action.
- The copy "You can change it anytime" implies the same values are editable later in tenant settings (BusinessProfile / proposal defaults — exact home not shown here).

Persona: tenant owner, first session. Density: **expressive** (large radii, generous padding, ambient bloom). Light theme only.

---

## 2. LAYOUT

### Shared structure (both viewports)

Full-bleed page, background `--canvas` (#F6F7F9), `overflow:hidden` on the page shell.

1. **Ambient bloom layer** (decorative, `pointer-events:none`): a `--glow-brand` radial disc, horizontally centered at the top, breathing animation `hg-bloom` 8s infinite (`scale 1 → 1.09`, `opacity .85 → 1`, `--ease-standard`). Disabled under `prefers-reduced-motion`. Same technique as the EmptyState bloom already implemented in the repo.
2. **Scroll container** above the bloom (`z-index:1`): flex column, `align-items:center`, `justify-content: safe center` (vertical centering that degrades to top-aligned when content overflows), `overflow-y:auto`.
3. **Content column**: `width:100%`, capped by `colMax`, its own vertical padding `padY`.

Column contents top-to-bottom (form step):

| # | Region | Spacing |
|---|--------|---------|
| 1 | **Wordmark** "Helio**Grid**" — 22px/700/−0.02em, "Grid" filled with `--gradient-brand` via background-clip text | margin-bottom 22 |
| 2 | **Step indicator row**: two bars 26×4, radius 2 (active = `--accent`, inactive = `--canvas-sunken`, gap 5) + overline `STEP 1 OF 2` (11px/700/uppercase/0.12em, `--text-tertiary`), row gap 12 | margin-bottom 20 |
| 3 | **H1** "What do you install?" — 30px/700/−0.025em/lh 1.1 | — |
| 4 | **Subhead** — 15px/1.5 `--text-secondary`, `max-width:40ch` | margin-top 10 |
| 5 | **Choice-card stack** (3 cards, vertical) | margin-top 24, gap 12 |
| 6 | **Typical system size field** (label + input row) | margin-top 22, label→field gap 7 |
| 7 | **Continue** — ds Button primary lg, full width (48px) | margin-top 24 |
| 8 | **Skip for now** — centered text button | margin-top 16, own padding 8 |

**Choice card anatomy** (each of the 3): horizontal flex, gap 14, padding 18, `--surface` background, **radius 20**, no border, text-align left, rendered as a `<button>`.
- Left: 44px circle, `--accent-subtle` fill, icon 22px `--accent` stroke 1.5.
- Middle (flex:1, min-width:0): title 16px/700/−0.01em `--text-primary`; sub-line 13px `--text-secondary`, margin-top 2.
- Right: 24px circular selection indicator — `--canvas-sunken` at rest, `--accent` when selected with a white 14px check (2.4 stroke), background transition 160ms.
- Elevation: rest `--e2` → hover `--e3` + `translateY(-1px)` → selected `--e3` + `0 0 0 2px var(--accent)` ring (ring persists with the −1px lift). Transitions: shadow 200ms `--ease-standard`, transform 120ms.

**Size field anatomy**: label row "Typical system size **· optional**" (13px/500 `--text-secondary`; "· optional" 400 `--text-tertiary`). Field row: height 56, horizontal padding 18, radius 16, gap 10; borderless input, `--font-mono` 18px, `tabular-nums`, `inputmode="decimal"`; right-aligned suffix literal **kW** (mono 15/500 `--text-secondary`).
- Disabled (no segment selected): `--canvas-sunken` background, no shadow, placeholder "Select an option above", `disabled` attribute set.
- Enabled: `--surface` background + `--e1`, placeholder "e.g. 5".
- Focused: `--e2, 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)` — exactly the ds borderless-input focus recipe.

**Done step** (replaces the whole form, demo end-state): 64px circle `--success-bg` with 30px `--success` check (1.8 stroke) → H1 "You're set up" (margin-top 22) → dynamic done line (15px `--text-secondary`, margin-top 10) → "Restart demo" accent text-button (margin-top 26; mockup-only affordance).

Both steps mount with `hg-rise`: 320ms `--ease-enter`, fade in + rise 8px (matches motion tokens: 320 emphasised / enter easing). Disabled under reduced motion.

### 375 (mobile)

- Canvas frame: 375×812 phone; component area 375×766 below a 46px status bar (canvas chrome, not product UI).
- `padX` 26 → content width 323. `padY` 20. `colMax` 620 (not binding at 375).
- Bloom: 520×520 at top −150.
- No bottom nav, no app topbar, no back control — a bare focused flow (consistent with the "nested screens drop the bottom nav" rule; onboarding predates the nav shell entirely).

### 1440 (desktop)

- Canvas frame: 1440×900 browser; component area 1440×852 below a 48px chrome bar showing `app.heliogrid.in/onboarding`.
- Same single centered column — **no** sidebar, no split panes. `padX` 56, `padY` 0, `colMax` **440** → a narrow centered card-less column, vertically centered.
- Bloom: 860×860 at top −180.
- All type/spacing identical to mobile (the layout is viewport-adaptive only in column width and bloom size).

No Card container wraps the column — the form sits directly on `--canvas` with the choice cards themselves being the elevated surfaces. Hierarchy is entirely luminance + elevation (compliant; zero borders anywhere).

---

## 3. EXACT COPY (verbatim; ⚡ = dynamic)

| Where | String |
|-------|--------|
| Wordmark | `HelioGrid` (Grid in brand gradient) |
| Overline | `Step 1 of 2` |
| H1 | `What do you install?` |
| Subhead | `This sets sensible defaults so your first proposal is close. You can change it anytime.` |
| Card 1 title | `Residential rooftop` |
| Card 1 sub | `Homes · 1 to 15 kW` |
| Card 2 title | `Commercial & industrial` |
| Card 2 sub | `Factories and warehouses · 20 kW and above` |
| Card 3 title | `Both` |
| Card 3 sub | `Residential and C&I projects` |
| Size label | `Typical system size` + ` · optional` |
| Size placeholder (disabled) | `Select an option above` |
| Size placeholder (enabled) | `e.g. 5` |
| Size suffix | `kW` (NEVER translated — i18n law) |
| Primary button | `Continue` |
| Skip control | `Skip for now` |
| Done H1 | `You're set up` |
| Done line — skipped ⚡ | `No problem — we'll use standard residential defaults for now. Change them anytime in settings.` |
| Done line — submitted ⚡ | `Defaults tuned for {segmentLabel}{, around {size} kW}. Next, create your first lead.` — segmentLabel ∈ `residential rooftop` / `commercial & industrial` / `residential and C&I`; the `, around {size} kW` fragment only when size non-empty. Falls back to `your business` if somehow unselected. |
| Demo-only | `Restart demo` |

Pre-fill defaults (dynamic values): res → `5`, ci → `50`, both → `10` (kW).

Canvas-wrapper-only copy (NOT product): "What do you install · Company onboarding" header, viewport labels, `9:41`, `app.heliogrid.in/onboarding`.

Copy language: English; sentence case throughout; buttons are verbs; the interpolated done line is a composed sentence → must become one ICU message per branch, not concatenation (i18n rule). "C&I" appears untranslated in card 3's sub — Hindi/Marathi treatment undefined (see §8).

---

## 4. COMPONENT MAP (against the 21-component `_ds` API)

| Mockup element | `_ds` mapping | Notes |
|---|---|---|
| Continue | **Button** `variant="primary" size="lg" fullWidth disabled` | The mockup literally imports `HelioGridDesignSystem_c8aa43.Button` with these props — clean 1:1. Near-black primary, 48px. |
| Skip for now | **Button** `variant="ghost" size="md"` | Mockup renders a bare 14px/400 text button; ghost is the closest sanctioned variant. 14px is off-scale (→ use 15px `--fs-button` via ghost). Padding 8 alone would miss the 44px target — ghost md (40px) + full-row hit area fixes it. |
| Choice card (×3) | **COMPOSITION — no single component.** Card-like surface + **IconCircle** + custom selection indicator, with **Radio** *semantics* | This is a "selectable radio-card", not in the 21. Build as a composed pattern: `role="radiogroup"` wrapping three `role="radio"` surfaces. The visual 24px filled-circle-with-check indicator is NOT the ds Radio dot — custom element. Do not reach for ListRow (it is list chrome, not a selectable card) or Chip (too small). |
| Card icon container | **IconCircle** (accent tint) | ⚠️ CONFLICT: mockup is 44px; ds law fixes IconCircle at 40px expressive / 32px functional. Use 40. |
| Selection indicator | none — custom | 24px circle, `--canvas-sunken` → `--accent` + white check. Accent as a *selected-state control fill* is explicitly allowed. Check stroke uses raw `#fff` (see conflicts). |
| Size field | **Input** with suffix adornment, mono numerics | Focus/rest/disabled recipes match the ds borderless Input exactly. Needs: `suffix="kW"`, mono/tabular styling, `inputmode="decimal"`. If `packages/ui` Input has no suffix slot → composition (Input + absolutely-positioned suffix inside the field surface). The NumberField **commit-on-blur** behavioural contract applies to this field. |
| Step indicator (2 bars) | none — custom | Not ProgressBar (that is a continuous meter). Two 26×4 rounded bars from tokens + the overline type style. Trivial composition; consider extracting if step 2 reuses it (it will). |
| Overline "Step 1 of 2" | typography tokens | The sanctioned 11px overline exception, on `--text-tertiary` — but overlines that carry meaning must use `--text-secondary` per docs/10 (this one is meaning-bearing: it tells you where you are). ⚠️ CONFLICT — use `--text-secondary`. |
| Wordmark | brand asset, not a component | Gradient text via `--gradient-brand` background-clip. Logo use of iridescence is presumably sanctioned atmosphere; no component exists. |
| Bloom | token `--glow-brand` | Reuse the EmptyState bloom implementation pattern (web CSS / RN react-native-svg radial already landed). |
| Done success circle | IconCircle-like, success tone | ⚠️ 64px is off the IconCircle sizes — composition with `--success-bg`/`--success`. |
| Restart demo | — | Mockup demo control. Drop from product. |

**CONFLICTS — raw values not derivable from the token scale** (ds spacing scale: 0/2/4/8/12/16/20/24/32/40/48/64/80/96; radius: 8/12/16/24/32/40/999; type: 11/12/13/15/17/20/24/32/40):

1. **Card radius 20px** — between `--r-md` 16 and `--r-card-expressive` 24. Resolve → 24 (expressive card) unless owner blesses 20 as an extension.
2. **Off-scale spacing**: padding 18 (cards, field), gaps 14/10/7/5, margins 22/26/2 — none on the 4px scale except 2. Resolve to nearest scale steps (18→16 or 20; 14→16; 22→24; 26→24; 10→12 or 8; 7→8; 5→4).
3. **Off-scale type**: 30px H1 (scale h1 = 32), 16px card title (→ 15 body/600 or 17 h4), 18px input text (→ 17), 22px wordmark, 14px skip/restart (→ 13 or 15), 12.5px chrome (canvas-only).
4. **IconCircle 44px** (law: 40/32) and **success circle 64px** — off-spec sizes.
5. **Raw hex `stroke="#fff"`** on both check SVGs — no on-accent/inverse text token exists in ds-source (`--surface` is the only white). Needs a token decision (e.g. an `--icon-on-accent` generation extension) — never inline `#fff`.
6. **Input wrap radius 16** vs `--r-input-expressive` 14 — use 14.
7. **Field height 56** — not a token; ds sizes top out at Button lg 48. Either bless 56 as the lg input height or drop to 48.
8. Step bars 26×4 r2, indicator 24px, icons 22/14/30px — decorative geometry; fine as component-internal constants but should live in the composed component, not screen code.
9. **Check-icon strokes 2.4 and 1.8** vs the Lucide 1.5px standard — indicator glyphs; call it out for the icon ruling.

Everything else — every color, shadow, easing, duration, focus recipe, hover raise of exactly one elevation step, accent-for-selection, near-black primary — is fully token-derivable and rule-compliant.

---

## 5. STATES & INTERACTIONS

State model (from the mockup's script): `step: 'form' | 'done'` · `selected: '' | 'res' | 'ci' | 'both'` · `size: string` · `hovered` · `focusedSize` · `skipped: boolean`.

### Step: form

**Initial (empty-selection) state**
- No card selected; all cards at `--e2`.
- Size field disabled: `disabled` attr, `--canvas-sunken`, no elevation, placeholder "Select an option above".
- Continue **disabled**. Skip always enabled.

**Selecting a card**
- Click/tap (or Enter/Space, they're `<button>`s) sets `selected` AND **overwrites `size` with the segment default** (5 / 50 / 10) — including when the user had already typed a custom value (see §8).
- Selected card: `--e3` + 2px `--accent` ring + −1px lift; indicator animates `--canvas-sunken`→`--accent` (160ms) and shows the check.
- Size field enables: `--surface` + `--e1`, placeholder "e.g. 5"; value shows the pre-filled default.
- Continue enables.
- Selection is single-choice, always replace, no deselect.

**Hover (pointer:hover only)**
- Card: `--e3` + translateY(−1px); shadow 200ms, transform 120ms. Exactly one elevation step — compliant.
- No hover-only meaning (hover mirrors a preview of selection elevation).

**Size input**
- `inputmode="decimal"`; on change the value is sanitized: strip everything but `[0-9.]`, clamp to 6 chars. (No single-dot guard — "5..5" passes; no range bounds. See §8.)
- Focus: ds focus ring recipe (`--e2` + 2px surface + 4px accent). Blur removes it.
- Product contract: NumberField **commit-on-blur** must apply (mockup doesn't normalize on blur).
- Optional — empty size is valid.

**Validation rules**
- Only gate: a segment must be selected for Continue. `submit()` also guards (`if (!selected) return`).
- No error states exist in the mockup — no failed-save, no invalid-size error. (DoD requires loading/error/offline — all three are undesigned here; see §8.)

**Skip**
- One tap, no confirmation → done with `skipped: true`. Product: proceed with "standard residential defaults".

**Focus order (DOM order)**: card Residential → card C&I → card Both → size input (when enabled; it is skipped while `disabled`) → Continue (skipped while disabled) → Skip. Keyboard: buttons activate on Enter/Space. ⚠️ Not a semantic radiogroup — no `role="radio"`/`aria-checked`, no roving tabindex/arrow keys; implementation must add them.

**Timers**: none (no OTP/resend on this screen).

### Step: done (demo end-state)

- Entire form is replaced (conditional render), mounts with `hg-rise` 320ms.
- Success circle + "You're set up" + branch-dependent done line (§3).
- "Restart demo" resets all state — mockup-only.
- In the real product this step is likely superseded by navigation to step 2 and the `YoureReady` finale (see §8).

### Motion summary

| What | Spec |
|---|---|
| Step mount | fade + 8px rise, 320ms `--ease-enter` |
| Bloom | scale 1→1.09 / opacity .85→1, 8s loop, `--ease-standard` |
| Card shadow | 200ms `--ease-standard` |
| Card transform | 120ms `--ease-standard` |
| Indicator fill | 160ms `--ease-standard` |
| Reduced motion | bloom + rise animations off (mockup does this explicitly); token law collapses durations to 1ms |

---

## 6. NAVIGATION

- **Entry**: post-signup redirect to `app.heliogrid.in/onboarding` (authenticated; new tenant, onboarding incomplete). First of 2 steps.
- **Forward**: Continue (persist segment + size) or Skip (persist standard residential defaults) → step 2 of 2 (unnamed in mockup). The flow finale in the sibling set is `YoureReady`/`ReadyFlow` ("You're set up, Rajesh" → create your first lead), whose CTA the done line here foreshadows.
- **Back**: no back affordance exists on step 1 (nothing to go back to inside onboarding). Browser back / re-entry behavior undefined.
- **Deep link**: `/onboarding` should be idempotent — completed-onboarding tenants get redirected to the app; step-2 users presumably resume at step 2 (undefined).
- **Later editing**: "Change them anytime in settings" — the same values must be editable in tenant settings (BusinessProfile / ProposalDefaults surface; exact home not specified).
- **Mobile app**: mockup is the web surface only (browser chrome, phone frame shows the responsive web). Whether onboarding gets native RN screens or is web-only (owner signs up on web) is not stated — lockstep-law question, §8.
- No orphan risk: wire from the signup success action and to the step-2 route in the same slice.

---

## 7. ICONS (Lucide best-guess; outlined, stroke noted)

| Element | Lucide name | Size / stroke in mockup |
|---|---|---|
| Residential card | `home` | 22 / 1.5 |
| Commercial & industrial card | `factory` | 22 / 1.5 |
| Both card | `layers` | 22 / 1.5 |
| Selection indicator check | `check` | 14 / 2.4 (white) |
| Done success check | `check` | 30 / 1.8 |
| Canvas-only (not product): browser lock | `lock` | 12 / 1.8 |

Card icons follow the icon standard (1.5px stroke, round caps/joins). The two check glyphs deviate in stroke weight — treat as indicator glyphs, but confirm against the Lucide standard ruling.

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **What is step 2 of 2?** Not linked from either file. Candidates in the mockup set: `YourRole`/`RoleFlow` (but its copy — "You're a Sales Rep…" — reads invited-member, not owner) or a business-profile step. Finale is presumably `YoureReady`. Needs an owner call before routing is built.
2. **Is the inline "You're set up" done-state product or demo-only?** It duplicates `ReadyFlow`'s message. Most likely Continue navigates straight to step 2 and the done-state is a demo terminus — confirm.
3. **Where exactly do the defaults land?** Which tenant settings fields does segment/size seed (proposal defaults? studio pre-fill? lead form)? "Standard residential defaults" is undefined as data.
4. **Re-selection clobbers user input**: choosing a card always overwrites `size` with the segment default, even after manual edits. Intended? (Recommend: only pre-fill when the field is untouched.)
5. **Size validation**: sanitizer permits multiple dots ("5..5"), leading zeros, up to 6 chars, no min/max; no commit-on-blur normalization shown despite the NumberField contract. Bounds needed (and does "Both" accept 0.5–100000?).
6. **No loading / error / offline states** — persistence failure UX, double-submit guard, and offline behavior are all undesigned; DoD requires them.
7. **A11y semantics**: cards are plain buttons, no radiogroup/aria-checked/arrow-key model; the disabled input is unfocusable (screen-reader users never hear "Select an option above"). Needs design-system-level resolution in the composed component.
8. **RN surface?** Lockstep law says modules with mobile surfaces ship RN in the same slice — is company onboarding web-only (owner desktop journey) or does the mobile app need it? Owner ruling needed.
9. **i18n**: "C&I" abbreviation and the "·" separators in Hindi/Marathi; the composed done line must be per-branch ICU messages; "kW" stays untranslated; Hindi text expansion at `colMax` 440 / 323-wide cards unverified.
10. **Off-scale values** (§4 conflicts: 20px radius, 18px padding, 16/30/18px type, 44/64px circles, 56px field height, `#fff` check stroke, 16px input radius) — each needs either snapping to scale or a marked generation-time extension. None may be inlined.
11. **Provenance**: the pre-filled sizes (5/50/10 kW) are *assumed*-tier values. When they flow into proposal defaults they must carry provenance; nothing here marks it.
12. **Overline color**: mockup uses `--text-tertiary` for the meaning-bearing "Step 1 of 2" — docs/10 requires `--text-secondary` for meaning-bearing overlines.
13. **Skip scope**: does Skip bypass just this step or the whole onboarding (straight to the app)? The done copy ("standard residential defaults") suggests whole-flow defaulting, but step 2 still exists.
