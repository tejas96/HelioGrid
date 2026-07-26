# Spec — "You're ready" (post-onboarding doorway)

Sources (read in full, binding):
- `design/mockups/YoureReady.dc.html` — canvas wrapper: 375×812 mobile frame + 1440×900 desktop frame, both mounting `ReadyFlow`.
- `design/mockups/ReadyFlow.dc.html` — the interactive screen (`variant: 'mobile' | 'desktop'`), 2 top-level steps.
- `design/mockups/SetupLater.dc.html` — imported sub-component (the quiet "finish setting up later" row + 3-section accordion). It is part of this surface and specced here.

---

## 1. PURPOSE + place in the auth journey

The terminal screen of company onboarding — the first thing a newly signed-up **owner** sees after account + company creation completes. Canvas annotation (verbatim, it is design intent):

> "A doorway, not a dashboard — two real next actions, no checklist and no setup progress bar. Both viewports are interactive: open either door, or expand the quiet 'finish setting up later' row. The demo project is how owners actually learn the product."

Journey position: `SignUp / SignUpFlow` (phone + OTP + company basics; its copy ends "…ready. Next, tell us what you sell.") → **You're ready** → either (a) lead quick-add, (b) the seeded demo project, or (c) inline completion of deferred setup (logo, GST, team invites). Desktop browser chrome in the wrapper shows the route: **`app.heliogrid.in/onboarding`**. Overline in the canvas header: "You're ready · Company onboarding".

Product intent encoded in the mockup:
- No progress bar, no checklist-as-gate. Setup debt is one collapsed row ("0 of 3 done") — never blocking.
- The demo project (a finished **8.2 kWp** Pune rooftop) is the onboarding tutorial. It must exist as seeded tenant data before this screen renders.
- Team invites are phone-number based (MSG91 OTP world — no email), with multi-role selection matching the D27/D28 preset-role model.

---

## 2. LAYOUT

### Shared structure (both viewports)

```
canvas (--canvas, full viewport, overflow hidden)
└─ bloom layer (absolute, top-center, --glow-brand radial, ambient pulse)
└─ scroll container (z:1, overflow-y auto, flex column, align center,
                     justify-content: safe center)
   └─ column (width 100%, max-width colMax)
      ├─ wordmark  "HelioGrid"          margin-bottom 26px
      ├─ [step: ready]
      │   ├─ success IconCircle 56px
      │   ├─ h1 (margin-top 20px)
      │   ├─ sub  (margin-top 10px)
      │   ├─ door stack (margin-top 24px, column, gap 12px)
      │   │   ├─ door card: Add your first lead
      │   │   └─ door card: Explore a demo project
      │   └─ SetupLater row (margin-top 14px)
      └─ [step: opening]
          ├─ spinner 44px
          ├─ h1 (margin-top 22px)  ├─ sub (margin-top 10px)
          └─ "Back to start" text link (margin-top 24px)
```

### Mobile 375 (content area 375×766 under a 46px status bar in the wrapper frame)
- `padX 26px` horizontal screen padding · `padY 20px` vertical column padding · `colMax 620px` (moot at 375 — effective column 323px).
- Content is top-anchored-when-tall (`justify-content: safe center` + scrollable).
- Bloom: 520×520, `top:-150px`, centered.

### Desktop 1440 (content area 1440×852 under a 48px browser chrome bar)
- `padX 56px` · `padY 0` · `colMax 440px` — a single centered narrow column, vertically centered. No sidebar, no app shell: this is still pre-app onboarding chrome.
- Bloom: 860×860, `top:-180px`, centered.

### Card usage & density
- **Density: expressive.** Doorway moment, generous 20px card padding, large radii, ambient gradient.
- Door cards: `--surface`, radius 22px, `--e2` rest / `--e3` hover, flat white on canvas — hierarchy purely by luminance + elevation, zero borders (DS rule 3 respected).
- SetupLater collapsed row: `--surface`, radius 16px (`--r-md`), `--e1` — deliberately one elevation step *below* the doors ("quiet").
- Inside SetupLater expanded: three section cards on `--surface-alt` (radius 14), whose *bodies* nest `--surface` + `--e1` cards (file row, team person rows) — a sunken-then-raised rhythm, still borderless.
- Spacing rhythm: 26 → 20 → 10 → 24 → 12 → 14 vertical cadence at top level; 16/18px paddings inside SetupLater; 6px label-to-field, 12–14px field-to-field.

---

## 3. EXACT COPY (verbatim; `{…}` = dynamic)

### Screen — ready step
| Element | String | Dynamic? |
|---|---|---|
| Wordmark | `HelioGrid` ("Grid" in gradient text) | no |
| H1 | `You're set up, Rajesh` | `Rajesh` = signed-in user's first name |
| Sub | `Your account is ready. Where would you like to start?` | no |
| Door 1 title | `Add your first lead` | no |
| Door 1 sub | `Start selling now — capture a lead in under a minute.` | no |
| Door 2 title | `Explore a demo project` | no |
| Door 2 sub | `A finished 8.2 kWp Pune rooftop — open it and poke around, nothing to break.` | `8.2 kWp` and `Pune` describe the seeded demo; treat as data-driven if seed varies. kWp never translated. |

### Screen — opening step (transition state)
| Trigger | Title | Sub |
|---|---|---|
| lead | `Opening lead capture` | `Let's capture your first customer.` |
| demo | `Opening the demo project` | `A finished 8.2 kWp Pune rooftop — explore the design and proposal, all safe to touch.` |
| later | `Opening setup` | `Add your logo, GST details or invite your team whenever suits you.` |

Plus text link: `Back to start` (see §8 — likely mockup-only).

### SetupLater — collapsed header
- Title `Finish setting up later`
- Sub `Company logo · GST details · invite your team`
- Counter `{n} of 3 done` (tabular-nums; n = saved sections 0–3)

### Logo section
- Header: `Add company logo` · sub `PNG or JPG, shown on your proposals` → saved sub: `Logo added`
- Drop-zone primary: desktop `Tap to choose, or drag a file here` · mobile `Tap to choose a file`
- Drop-zone helper: `PNG or JPG · max 5 MB · at least 300px wide`
- File row actions: `Replace` · `Remove` · size label `{X.X} MB` / `{N} KB` (dynamic)
- Errors: `Use a PNG or JPG file` · `That file is {mb} MB. Maximum is 5 MB.` · `Too small to print clearly. Use an image at least 300px wide.`
- Warning: `Tall logos may be cropped on your proposal.`
- Button: `Save logo`

### GST section
- Header: `Add GST details` · sub `For GST-compliant proposals` → saved sub: `{GSTIN} · {StateName}`
- Labels: `GSTIN` · `Legal business name · as on your GST certificate` (suffix after `·` is tertiary/regular) · `State`
- Placeholders: `27AABCU9603R1ZX` · `e.g. Suryodaya Solar Pvt Ltd`
- State well: empty `Filled from your GSTIN` → derived `{StateName} — from your GSTIN` (with leading check)
- Errors: `GSTIN must be 15 characters` · `That doesn't look like a valid GSTIN. Check the format: 27AABCU9603R1ZX` · `The first two digits aren't a valid state code` · `Enter the legal name (at least 3 characters)`
- Button: `Save GST details`

### Team section
- Header: `Invite your team` · sub `Add colleagues by phone number` → saved sub: `{n} invite{s} sent`
- Row overline: `Person {n}` (rendered uppercase) · remove button aria-label `Remove`
- Phone prefix: `+91` · placeholder `98765 43210`
- Role label: `Role · pick one or more`
- Role chips: `Manager` · `Sales rep` · `Surveyor` · `Designer` · `Engineer`
- Errors: `Enter a 10-digit mobile number` · `That isn't a valid Indian mobile number` · `That's your number — you're already here` · `You've already added this number` · `Pick at least one role`
- Add link: `Add another`
- Button: `Send invite` (1 row) / `Send {n} invites` (dynamic)

All copy is EN source for the Lingui catalog; sentence case throughout; buttons are verbs (DS law honoured). ICU plural needed for `{n} invite{s} sent` and `Send {n} invites`.

---

## 4. COMPONENT MAP (against the 21-component `_ds` API)

### Clean mappings
| Mockup element | `_ds` component | Props |
|---|---|---|
| `Save logo` / `Save GST details` / `Send invite(s)` | **Button** | `variant="primary" size="md"` `disabled={…}` — the mockup literally imports `HelioGridDesignSystem.Button` for all three. Near-black fill, correct. |
| Role chips | **Chip** | selectable Chip, selected = `--accent-subtle` bg + `--accent` text + leading 13px check; unselected `--neutral-bg` + `--text-secondary`. 34px height, pill. Multi-select toggle. |
| GSTIN / legal-name / phone fields | **Input** | borderless `--e1` rest, 52px, radius 14, focus `--e2 + 0 0 0 2px surface + 0 0 0 4px accent`, error `inset 0 0 0 1.5px --danger` — byte-identical to the DS Input contract. GSTIN + phone: mono, `tabular-nums` (numerics-as-data rule). |
| Door leading circles / section icons / success mark | **IconCircle** | tinted circle + Lucide icon. Semantic tints: `--accent-subtle`/`--accent`, `--warning-bg`/`--warning`, `--success-bg`/`--success`, `--neutral-bg`/`--text-secondary`. |
| Door cards / SetupLater header / section headers | **ListRow** (pressable) inside **Card** | leading IconCircle · title+subtitle · trailing element — ListRow anatomy exactly; see conflicts for the composition caveat. |
| Remove-person X, (optionally) restart link | **IconButton** | ghost, 44px target required. |

### Compositions required (no single `_ds` primitive)
1. **Door card** — a whole Card is one press target (Card `pressable` + ListRow content + trailing 40px arrow IconCircle). Hover: `--e2 → --e3` + `translateY(-1px)` (exactly one step — DS-legal). Press: scale 0.97. Radius 22 (see conflicts).
2. **Accordion** — SetupLater expand/collapse and the one-open-at-a-time section behaviour. Not in the 21-set; compose from Card + pressable header rows + rotating chevron (200ms). No new global pattern — screen-local composition.
3. **File drop-zone** — dashed `1.5px dashed --text-disabled` (drag-over: `--accent` dash + `--accent-subtle` bg). Dashed borders are the *sanctioned* DS exception for upload zones. Hidden `<input type=file accept="image/png,image/jpeg">`; web gets drag events, RN gets picker only.
4. **Saved check badge** — 22px `--success` circle with white check on section headers. Not Badge/StatusChip (those are text-bearing); tiny IconCircle-like composition.
5. **Spinner** — 44px ring, 3px `--accent-subtle` track / `--accent` head, 0.7s linear rotation. **There is no spinner in the 21-component set** (only ProgressBar/Skeleton territory). Needs a ruling: add as marked DS extension or swap for skeleton treatment.
6. **Derived read-only field** (State) — `--canvas-sunken` well, radius 14, non-interactive, check + value + provenance suffix. Not Input (never focusable); simple composition.
7. **Phone prefix adornment** — `+91` mono bold inside the Input wrapper. Needs Input `prefix`/leading-adornment support or wrapper composition.
8. **Wordmark** — `HelioGrid` with "Grid" in `--gradient-brand` text-clip. Brand atom, not a `_ds` component; on RN needs MaskedView or pre-rendered SVG (gradient text-clip doesn't exist natively).
9. **Bloom layer** — `--glow-brand` radial, ambient scale/opacity pulse. RN: `react-native-svg` radial (the EmptyState bloom precedent from 2026-07-26 — reuse that implementation).
10. **Text links** (`Replace`, `Remove`, `Add another`, `Back to start`) — accent-coloured text buttons; map to Button `variant="ghost"` only if ghost supports link-like compact styling, else a Link/TextButton composition.

### CONFLICTS — raw values not on the token scale
| Value | Where | Nearest token | Ruling needed |
|---|---|---|---|
| font 30px h1 (`-0.025em` = h1 tracking) | ready heading | `--fs-h1` 32 / `--fs-h2` 24 | off-scale size; use h1 32 or sanction 30 |
| font 26px | opening heading | h2 24 | off-scale |
| font 22px | wordmark | h3 20 | brand atom — probably acceptable as logo, not type scale |
| font 14.5 / 13.5 / 12.5px | row titles, door subs, helpers (used ~15×) | 15 / 13 / 12 | half-pixel sizes are NOT in the scale — snap to 15/13/12 unless owner sanctions |
| font 16px inputs | all three inputs | `--fs-body` 15 | 16px is the iOS no-zoom threshold — likely intentional; needs a named token (e.g. `--fs-input`) |
| overline `Person {n}` 12px / 0.1em | team rows | overline 11px / 0.12em | violates the ONE sub-12px exception spec — snap to canonical overline |
| radius 22px | door cards | `--r-lg` 24 | snap to 24 |
| radius 14px on *cards* (sections, drop-zone) | SetupLater | 14 exists only as `--r-input-expressive` | reuse or add `--r-14` alias |
| radius 10px thumb | logo file row | `--rf-input-functional` 10 | token exists but functional-namespace on an expressive screen |
| IconCircle 56 / 48 / 36 / 22px | throughout | DS spec: 40 expressive / 32 functional | 40 (arrow circles) is legal; 56/48/36/22 are size extensions |
| icon sizes 28 / 26 / 18 / 16 / 14 / 13px | throughout | Lucide std 24 / 20 / 28 | 18-and-below are off-standard sizes |
| padX 26 (mobile) / 56 (desktop) | screen padding | `--screen-pad-mobile` 20 / `--screen-pad-desktop` 32 | onboarding-specific padding — tokenize or snap |
| colMax 440 / 620, bloom 520/860, offsets -150/-180 | layout | none | screen-local constants; tokenize as extensions if kept |
| gaps/margins 26, 22, 18, 14, 10, 7, 6, 3px | rhythm | 4px scale (…12, 16, 20, 24…) | 26/22/18/14/10/7/3 are off the sanctioned spacing steps |
| chip 34px height, chip pad `0 14px` (`0 14 0 11` selected) | role chips | Chip's own token | must come from the Chip component, not per-screen |
| weight 700 on 17px door titles & 14.5 headers | throughout | DS weights 400/500/600/700 | legal, but consider 600 (`--fw-semibold`) for sub-heading uses per owner ruling |
| `#fff` arrow on `--action-primary` circle, `#fff` check in saved badge | doors, badges | `--text-on-primary`-equivalent alias | use the semantic alias, never literal |

No colour hexes outside chrome; every colour is a real ds-source token (`--glow-brand`, `--gradient-brand`, `--accent-subtle`, `--neutral-bg`, `--success/-bg`, `--warning/-bg`, `--danger`, `--text-disabled`, `--canvas-sunken`, `--surface-alt` all verified present in `design/ds-source/tokens/colors.css`). Status bar / browser chrome in `YoureReady.dc.html` is presentation-frame only — not product UI.

---

## 5. STATES & INTERACTIONS

### Screen-level state machine
`ready` → (door press or later-flow) → `opening{lead|demo|later}` → route change.
- Both steps mount with **rise entrance**: fade + translateY(8px→0), 320ms `--ease-enter` (the DS "emphasised" duration). `prefers-reduced-motion`: animation removed entirely (and bloom pulse stopped) — note DS says collapse to 1ms; mockup uses `animation:none`, equivalent intent.
- Door hover (pointer:hover only): `--e2 → --e3`, `translateY(-1px)`; shadow 200ms `--ease-standard`, transform 120ms. Never more than one elevation step.
- Opening step: spinner + contextual title/sub (copy §3). This is a *transition* surface, expected lifetime <1s; if navigation stalls, it is the loading state.

### SetupLater accordion
- Collapsed by default. Header press toggles `expanded`; chevron rotates 180°, 200ms.
- Exactly **one section open at a time** (`open ∈ {'', logo, gst, team}`); pressing an open section's header closes it.
- Saving any section: sets its saved flag, **closes the section**, updates header counter (`{n} of 3 done`), swaps the section sub-line to its saved variant in `--success` /wt 500, and shows the 22px green check badge. Sections remain re-openable after save (edit again).

### Logo section
- Empty → drop-zone. Click/tap opens file picker; web drag-over recolours zone (140ms bg/border transition).
- File chosen → validation pipeline, in order:
  1. type ∉ {png, jpeg} → error `Use a PNG or JPG file`
  2. size > 5 MB (5×1048576) → `That file is {mb} MB. Maximum is 5 MB.` (mb = 1-decimal)
  3. decoded width < 300px → `Too small to print clearly. Use an image at least 300px wide.`
  4. height > width → non-blocking warning `Tall logos may be cropped on your proposal.` (warning colour + triangle icon)
- Valid file → file row: thumbnail (object-fit contain; generic file icon while/if no decode), name (ellipsis), size (KB below 1 MB, rounded up ≥1 KB; MB 1-decimal above).
- `Replace` reopens picker; `Remove` returns to drop-zone and clears errors.
- `Save logo` disabled while no file or error present. Warning does NOT disable.

### GST section
- **GSTIN input**: sanitized live — uppercase, strip non-`[A-Z0-9]`, hard cap 15. Mono, letter-spacing 0.04em. Touched-on-blur error model: no error while pristine; validate on blur; once touched, re-validate on every change. Rules in order: length ≠ 15 → `GSTIN must be 15 characters`; regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$` fail → format error; state code ∉ 01–38 → state-code error.
- **State**: pure derivation from GSTIN digits 1–2 via the full 38-entry GST state-code map (in the mockup script — port as data). Never user-editable. Shows provenance suffix "— from your GSTIN" (this is the screen's provenance-tier display: derived).
- **Legal name**: touched-on-blur; `trim().length ≥ 3`.
- `Save GST details` enabled only when GSTIN fully valid AND name valid — computed live, independent of touched flags.

### Team section
- Starts with one empty person row. `Add another` appends; X removes (only rendered when >1 row).
- **Phone**: digits only, cap 10, live-stripped; `+91` fixed prefix. Touched-on-blur. Rules in order: length ≠ 10; first digit ∉ 6–9 (`That isn't a valid Indian mobile number`); equals the owner's own number (`That's your number — you're already here`); duplicates an earlier row (`You've already added this number`).
- **Roles**: multi-select chips; any tap marks role-touched; empty selection → `Pick at least one role`. The 5 invitable roles = the D27 presets minus Owner.
- Save button label pluralises with row count; disabled until every row passes phone + role.

### Focus & keyboard
- Focus order (ready): doors top-to-bottom → SetupLater header → (if expanded) section headers / fields in DOM order → section save button.
- All headers/doors are real `<button>`s — Enter/Space activate. Accordion headers need `aria-expanded`; sections `role=region` + labelling.
- Field focus ring is the canonical accent double-ring (spec §4 Input row); never removed.
- Chips: toggle buttons → `aria-pressed`. Remove-X carries `aria-label="Remove"` (should include person context, see §8).
- Touch targets: chips are 34px tall and text links are bare — pad hit-slop to ≥44px in implementation (DS hard rule).

### Timers / motion inventory
- No OTP or countdown timers on this surface.
- `hg-bloom` 8s infinite ambient pulse (scale 1→1.09, opacity .85→1) — "ambient" 500ms class doesn't apply; it's decorative; killed under reduced motion.
- `hg-rise` 320ms enter; `hg-spin` 0.7s linear; chevrons 200ms; drop-zone/chip colour 140ms.

### Missing states (must be designed in implementation — DS four-state law)
- **Offline**: none mocked. Saves (logo upload → Tigris, GST → tenant record, invites → MSG91 sends) all require connectivity; needs OfflineBanner + disabled saves or queued behaviour.
- **Server error / in-flight**: mock saves succeed instantly and locally. Real flows need Button loading state + failure Toast, and success feedback (Toast) beyond the silent section-close.
- **Empty**: n/a (screen is its own content). **Loading**: the opening step covers exit-loading; initial load needs skeleton or is instant from session.

---

## 6. NAVIGATION

- **Entry**: completion of SignUpFlow's company-onboarding steps → route `/onboarding` (per desktop chrome `app.heliogrid.in/onboarding`). Owner-role users only; invited users land on `InviteLanding`/`InviteFlow` instead — never here.
- **Exits**:
  - Door 1 → lead capture (quick-add) surface, via `opening/lead` transition.
  - Door 2 → the seeded demo project detail/studio, via `opening/demo`.
  - SetupLater never navigates — all three tasks complete inline. (`Opening setup` copy exists for a `later` transition but nothing in the mockups triggers it — see §8.)
- **Back behaviour**: unspecified. Signup is complete, so back must NOT return into OTP/signup steps; recommend replacing history at `/onboarding`. In-screen `Back to start` returns opening→ready (see §8).
- **Deep link**: `/onboarding` re-shows this screen; whether it remains reachable after first meaningful action (first real lead?) is undefined — see §8.
- **Re-entry state**: saved flags must persist server-side (`{n} of 3 done` on return), not component state.
- **Mobile (RN)**: same screen ships in the same slice (lockstep law); no bottom nav here (pre-app onboarding context, matches mockup's chrome-free frame).

---

## 7. ICONS (Lucide, 1.5px stroke default, round caps/joins)

| Icon | Use | Size in mockup |
|---|---|---|
| `check` | success mark (28), state-derived tick (16, 1.6px), saved badges (13, 2.6px), selected chip (13, 2.4px) | 28/16/13 |
| `user-plus` | door 1 leading | 24 |
| `sun` | door 2 leading | 24 |
| `arrow-right` | door trailing circles (1.7px) | 20 |
| `settings` | SetupLater header | 20 |
| `image` | logo section header | 18 |
| `upload` | drop-zone | 26 |
| `file-text` | GST section header | 18 |
| `file` | thumb fallback | 24 |
| `users` | team section header | 18 |
| `chevron-down` | all accordion chevrons (1.7px) | 20 header / 18 sections |
| `x` | remove person (1.7px) | 16 |
| `plus` | add another (1.7px) | 18 |
| `triangle-alert` | logo warning (1.6px) | 14 |
| `loader-circle` (as ring) | opening spinner | 44 ring |

(Status-bar and lock glyphs in `YoureReady.dc.html` are frame chrome, not product icons.) Stroke widths 1.6–2.6 deviate from the 1.5px standard on small sizes — optical compensation; note for the icon standard.

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **`Back to start` on the opening step** — real navigation would leave the screen immediately; a back link on a sub-second transition is almost certainly a mockup demo affordance. Ship it only if navigation can genuinely be cancelled; otherwise drop.
2. **`later` opening variant** (`Opening setup` / "Add your logo…") — defined in copy but unreachable in both mockups (SetupLater expands inline). Dead copy, or is there an intended path that routes to full BusinessProfile settings? Owner call.
3. **Post-save feedback** — sections close silently. Are Toasts expected (`Logo saved`, `2 invites sent`)? Invites especially: an SMS send with zero confirmation feels wrong.
4. **Server semantics of saves** — GSTIN checksum (mockup validates format only, not the check digit), logo upload pipeline, invite delivery + resend/revoke are all unspecified. Where do invited people surface afterwards (Team settings)?
5. **Persistence of "n of 3 done"** across sessions/devices — implied but unmocked; and does completing all 3 change or remove the row?
6. **When does `/onboarding` stop being reachable** (or does it become a permanent launcher)? What do doors do on 2nd visit when a real lead already exists?
7. **Demo project provenance** — is "8.2 kWp Pune rooftop" a fixed platform seed (copy hardcodable) or per-tenant variable (copy must be data-driven)? Copy repeats it in two places with different phrasing.
8. **Owner's own number** for the self-invite check is hardcoded `9876543210` in the mockup — obviously session data in real life; confirm it compares against the signed-in user's verified phone.
9. **`Rajesh`** — assumed session user first name; confirm fallback when name wasn't captured at signup.
10. **Hindi/Marathi expansion** — long strings (`That doesn't look like a valid GSTIN…`, door subs) at 323px column width need the mandatory Hindi render check; `Person {n}` uppercase overline has no Devanagari uppercase concept — needs an i18n treatment ruling.
11. **RN parity of web-only affordances** — drag-and-drop, hover elevation, gradient text-clip wordmark: define the RN equivalents (picker-only, press states, MaskedView/SVG) in the slice.
12. **Off-scale values** (§4 conflicts table): each needs snap-to-token or a marked generation-time extension — none may be inlined.
13. **The `is-owner-only` guard** — screen assumes owner persona ("your logo, GST, invite your team"); what happens if a non-owner hits `/onboarding` directly?
14. **Duplicate-phone rule direction** — mockup flags a duplicate only on the *later* row (`k < i`); the earlier row stays valid. Fine, but confirm the invite API dedupes server-side too.
15. **Spinner component** — no spinner exists in the 21-component set; add as DS extension or restyle the opening step (see §4.5).
