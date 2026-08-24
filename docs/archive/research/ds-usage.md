> **NORMATIVE** — still binding: a live document delegates authority to this file. Do not archive it without promoting its content first. docs/10 and docs/15 R19 cite its empirical usage statistics as ground truth for which component specs are real rather than theoretical.

# HelioGrid Mockups — Design-System Usage Ground Truth

Scope: 80 `*.dc.html` mockups in `/Users/devtejas/Downloads/HelioGrid UX` + the DS bundle at `/Users/devtejas/Downloads/HelioGrid UX/_ds/heliogrid-design-system-c8aa4326-21bf-453a-8d11-749cc81dee12`. (Verified against disk 2026-07-30: exactly **80** `*.dc.html`, inclusive of the 7 `Layout*` sub-sheets and `Project Flow.dc.html`. Earlier "85 mockups" references in the corpus were wrong under any counting and have been corrected.)

## 0. The single most important reality

The DS bundle exposes **one global namespace: `window.HelioGridDesignSystem_c8aa43`** (manifest `namespace:"HelioGridDesignSystem_c8aa43"`). It ships **21 React components**. But in the actual mockups **only ONE component is ever consumed from it** — `Button`, via the `<x-import component-from-global-scope="…">` mechanism (83 instances across 21 files). **The other 20 components are never imported** — every mockup hand-rolls Cards, Chips, StatusChips, Inputs, Tabs, etc. as raw `<div>`/`<button>` + inline styles that *reference the CSS tokens* but re-implement the component's visual spec by hand.

So the DS is consumed as: **(a) global CSS custom-property tokens (heavily), (b) the `Button` React component (narrowly), (c) the two variable webfonts.** The JSX component library is essentially a spec, not a runtime dependency, for ~59 of the mockups.

---

## 1. Component library surface (`window.HelioGridDesignSystem_c8aa43`)

All 21, with the real prop/variant API from `_ds_bundle.js`. "Hand-rolled in mockups" = appears visually but not via `x-import`.

| Component | Key props (defaults) | Variants / enums | Signature spec | Real usage |
|---|---|---|---|---|
| **Avatar** | `src, name="", size=40, style` | — | circle, `--accent-subtle` bg, `--accent` text, initials (2 chars, uppercased), weight 500 | Hand-rolled everywhere (e.g. MyDay `av34/av56/initials` inline circles) |
| **AvatarGroup** | `people=[], size=32, max=4` | — | overlap `-0.3×size`, 2px `--surface` ring, "+N" overflow chip | Hand-rolled (Leads/TeamRoles owner stacks) |
| **Card** | `density="expressive", interactive=false, selected=false, onClick` | density: expressive\|functional | `--r-card-expressive`(24px)/`--r-card-functional`(12px); pad 24/16; `--e2` rest→`--e3`+`translateY(-1px)` hover; selected = `--e2, 0 0 0 2px var(--accent)` | Hand-rolled as `mCard` style strings (MyDay, Leads) |
| **IconCircle** | `color="var(--accent)", size=40` | — | circle, bg `color-mix(in srgb, {color} 6%, white)`, fg `{color}` | Hand-rolled (ListRow leading, DesignStudio) |
| **Chip** | `active=false, dot, tone="neutral", density="expressive", onClick` | tone: neutral\|success\|warning\|danger\|info\|accent | pill; rest white+`--e1`; **active → `--action-primary` fill, #fff text**; h 28/24; size 13/12; weight 500 | Hand-rolled filter chips (Leads `Chips`, DesignStudio `chipStyleD`) |
| **Badge** | `tone="neutral", density="expressive"` | tone: neutral\|success\|warning\|danger\|info\|accent | pill, `{semantic}` + `{semantic}-bg`, weight 500 | Hand-rolled |
| **ListRow** | `icon, iconColor="var(--accent)", avatar, title, subtitle, trailing, density, onClick` | density | minH 64/44; pad 10-16/6-12; title weight 700, `-0.01em`; hover = `--surface`+`--e2`; "separates by luminance/gap, never a divider" | Hand-rolled (MyDay task rows) |
| **StatCard** | `label, value, unit, delta, deltaDir="up"` | deltaDir: up\|down | overline(11px/700/0.12em/`--text-tertiary`)→value(32px/700/`-0.025em`/tabular)→delta pill(up=`--success`/`-bg`, down=`--danger`/`-bg`), radius 24px | Hand-rolled KPI tiles (OwnerDashboard, RepDashboard) |
| **StatusChip** | `status="lead", label, density` | status: `lead, survey-scheduled, design-in-progress, approved, installing, commissioned, on-hold` | **domain status→semantic colour map** (see §3); pill + 6px dot; "status never by colour alone — always label + dot" | Hand-rolled (`statusLine`/`chip` in Leads, LeadDetail) |
| **EmptyState** | `icon, title, description, action, glow=true` | — | centred; 180×180 `--glow-brand` bloom behind 72px circle | Hand-rolled |
| **OfflineBanner** | `count=0, message` | — | pill, `--warning-bg`/`--warning`, h32, `--e1`; default `Offline — N changes queued` | Hand-rolled where offline states shown |
| **ProgressBar** | `value=0, gradient=false` | gradient bool | 6px pill track `--canvas-sunken`; fill `--accent`, or **`--gradient-brand` when `gradient` (AI/long ops)**; `--dur-emphasised`(320ms) width tween | Hand-rolled |
| **Toast** | `tone="success", title, description, icon, action` | tone: success\|warning\|danger\|info\|neutral | white card, radius 16, `--e5`, 36px semantic icon circle | Hand-rolled |
| **Button** ✅ | `variant="primary", size="lg", disabled, loading, icon, iconRight, fullWidth, onClick` | **variant: primary\|secondary\|ghost\|destructive**; **size: lg(48px/`0 24px`/15)\|md(40px/`0 20px`/15)\|sm(32px/`0 16px`/13)** | pill (`--r-pill`), **weight 500**, `-0.01em`, `minHeight:44`; primary=`--action-primary`#0A0A0B/#fff, hover→`--action-primary-hover`#26262A; press `scale(0.97)`; disabled=`--canvas-sunken`/`--text-disabled` | **THE consumed one** — see §1a |
| **Checkbox** | `checked, onChange, label, disabled, id` | — | 20px, radius **6px**, checked=`--accent` fill+white check | Hand-rolled |
| **IconButton** | `size=40, label, variant="surface", disabled` | **variant: surface\|dark\|ghost** | circle, `minWidth/Height:44`; dark=`--action-primary`/#fff; press `scale(0.94)` | Hand-rolled (MyDay `mIconBtn` call/WhatsApp buttons) |
| **Input** | `label, type="text", density="expressive", error, success, helper, disabled, mono=false, leading, trailing` | density; states error/success | **borderless**, `--e1` rest; **focus = `--e2, 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)`** (no border appears); h 52/40; radius `--r-input-expressive`(14px)/`--r-input-functional`(10px); **`mono`→`--font-mono`**; error ring `inset 0 0 0 1.5px --danger` | Hand-rolled (QuickAddLead, ProposalEntry fields) |
| **Radio** | `checked, label, name, value, disabled, id` | — | 20px, checked=`inset 0 0 0 2px --accent` ring + 10px `--accent` dot | Hand-rolled |
| **Switch** | `checked, label, disabled, id` | — | 52×32 track `--canvas-sunken`→`--accent`; 24px thumb #fff+`--e2`; **`--ease-spring` slide** | Hand-rolled (Settings, ProfilePreferences) |
| **SegmentedControl** | `options=[], value, onChange` | opts as strings or `{value,label}` | pill on `--canvas-sunken`; active=white pill+`--e2`; **`--dur-emphasised`+`--ease-spring`** slide; 32px, 13px/500 | Hand-rolled (numerous mobile toggles) |
| **Tabs** | `tabs=[], value, onChange` | tabs as strings or `{value,label}` | underline: **2px `--accent`** indicator slides; active weight 500 vs 400; gap 28 | Hand-rolled (LeadDetail, Settings tab bars) |

Bundle mechanics: each component is wrapped in `try{(()=>{…Object.assign(__ds_scope,{X})})()}catch(e){__ds_ns.__errors.push(...)}`. The desktop UI-kit (`ui_kits/desktop/screens.jsx`, line ~1323) destructures the full set from `window.HGDesktop` — that's the kit, not the mockups.

### 1a. Button — the one live component, actual props used

83 `x-import` instances across these 21 files: `AgentCallResult, AgentKnowledge, AgentQueue, AgentSetup, AgentTest, AgentUnanswered, InviteFlow, Leads, MyDay, LoginFlow, ProposalFormSteps, ProposalStep3, Proposals, ProposalPreview, ProposalEntry, ProposalStep8, ProposalShare, RoleFlow, SetupLater, SignUpFlow, SellFlow`.

Attribute frequency (ground truth):
- `variant`: **primary ×59, secondary ×22, ghost ×1, danger ×1** — note `variant="danger"` is a **bug/mismatch**: the bundle's key is `destructive`, so `VARIANTS["danger"]` is undefined and **falls back to primary (near-black)**, not red.
- `size`: **lg ×48, md ×33, sm ×2** (default lg).
- `full-width="{{ true }}"` ×37; `disabled="{{ …bound }}"` bound to expressions (`continueDisabled`, `teamSaveDisabled`, `gstSaveDisabled`, etc.).
- `hint-size` (renderer placeholder box, not a real Button prop) always mirrors the size: `100%,48px` (lg full-width), `100%,40px` (md full-width), fixed `150px,48px` etc.
- Real invocation form: `<x-import component-from-global-scope="HelioGridDesignSystem_c8aa43.Button" variant="primary" size="lg" full-width="{{ true }}" hint-size="100%,48px" style="width:100%">Add a lead</x-import>`

---

## 2. Font usage reality

Two bundled variable webfonts only, both `weight:100 900, font-display:swap` (`tokens/fonts.css`): **`Geist[wght].woff2`** and **`GeistMono[wght].woff2`**. Stacks (`tokens/typography.css`):
- `--font-sans: "Geist","Inter",-apple-system,system-ui,sans-serif`
- `--font-mono: "Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace`

**`font-family` declarations across mockups (counts):**
- `var(--font-mono)` ×564
- `inherit` ×376 (+11) — buttons/inputs inheriting Geist from `body`
- `var(--font-sans)` ×95
- **Zero non-Geist explicit families.** Grep for `inter|arial|helvetica|roboto|noto|serif|times|courier|georgia|system-ui|-apple-system` inside mockup `font-family` = **0 hits**. No mockup defines an `@font-face`. So the only fonts that render are **Geist** (default) and **Geist Mono**; there is no `Inter` file bundled (it's a stack fallback that never loads).

**`font-weight` declarations actually rendered (counts):**
- `700` ×1331 · `500` ×1213 · **`600` ×210** · `400` ×21 (explicit; 400 is also the `body` default) · `{{ r.weight }}` ×2 (bound, in a type specimen).
- **Discrepancy vs. spec:** `typography.css` states *"Two weights in normal use: 400 / 700. 500 permitted for buttons, tabs, table headers only."* In reality **500 is used pervasively (1213×)** far beyond buttons/tabs/headers, and **weight `600` is entirely off-token** (no `--fw-*` defines 600; tokens are `--fw-regular:400 / --fw-medium:500 / --fw-bold:700`). 600 concentrates in `Project Flow`(22), `RoofSetup`(14), `SurveyReview`(12), `SurveyMode`(9), `Components`(8), `CatalogPriceBook`(8) — i.e. dense desktop/data screens.

**Geist Mono reality — where it renders** (top files: `Project Flow` 47, `RoofSetup` 38, `OwnerDashboard` 31, `Obstructions` 24, `MyDay` 24, `DesignStudio` 23, `ProposalStep3` 21). It is applied, essentially always paired with `font-variant-numeric:tabular-nums`, to:
- **IDs / phone numbers** — `font-family:var(--font-mono); font-size:14px; …>{{ selectedLead.phone }}` (MyDay).
- **kWh / kW / system-size readings** — e.g. `7000 kW`, `10 kWh`, `8.2 kW` (ProposalStep3), `{{ row.size }} · {{ row.value }}` (MyDay task metadata, 12.5px).
- **Currency ₹ amounts** — ₹ appears in 23 files; monetary values in ProposalStep3 line-item tables use `var(--font-mono); font-size:15px; font-weight:500; tabular-nums`, right-aligned; delta chips use mono 700 (`deltaChip` in DesignStudio: `fontFamily:'var(--font-mono)', fontWeight:700`).
- **Counts / dates / coordinates** — `13 tasks`, day labels (`{{ d.day }}`, 34px-wide column).
- Common mono sizes: **12px, 12.5px, 13px, 14px, 15px**; weight 500 or 700 for emphasis, else inherits 400.

---

## 3. Colour usage reality (5 sampled mockups)

Token color spine (`tokens/colors.css`): canvas `#F6F7F9`, canvas-sunken `#EEF0F3`, surface `#FFFFFF`, surface-alt `#FAFBFC`; text `#0A0A0B / #74787E / #A1A5AC / #C7CAD0`; hairline `rgba(10,10,11,0.06)`. **Accent `#5A4BFF`** (hover `#4A3BF0`, subtle `#EEECFF`). **Action-primary near-black `#0A0A0B`** (hover `#26262A`, pressed `#000000`). Semantics: success `#159A5B`/`#E9F7EF`, warning `#E9A23B`/`#FDF4E6`, danger `#E5484D`/`#FDECEC`, info `#3B82F6`/`#EAF2FE`, neutral `#74787E`/`#F0F1F3`. Iridescence: violet `#7B5CFF`, blue `#3B82F6`, magenta `#E85CBE`; `--gradient-brand: linear-gradient(135deg,#7B5CFF 0%,#3B82F6 45%,#E85CBE 100%)`; `--glow-brand: radial-gradient(circle,rgba(123,92,255,0.22) 0%,rgba(59,130,246,0.14) 40%,rgba(255,255,255,0) 72%)`. Chart 1–8: `#5A4BFF, #3B82F6, #E85CBE, #159A5B, #E9A23B, #7B5CFF, #14B8C4, #A1A5AC`, gridline `#EEF0F3`.

Token usage counts in the 5 samples (`action-primary / accent / accent-subtle / gradient-brand / glow-brand / chart / iris`):
- **MyDay**: 3 / 11 / 6 / 5 / 3 / 0 / 4
- **Leads**: 3 / 20 / 6 / 2 / 2 / 0 / 0
- **ProposalStep3**: 4 / 12 / 6 / 2 / 0 / 0 / 3
- **CustomerProposal**: 0 / 1 / 1 / 0 / 0 / 0 / 0 (a pure QA harness, §5)
- **DesignStudio**: 11 / 16 / 10 / 0 / 2 / 2 / 0

**"Arc bar" (MyDay `<!-- ARC NAV -->`, line 202):** a curved SVG bottom-nav bar, `path d="M0,34 Q187.5,-10 375,34 L375,96 L0,96 Z" fill="var(--surface)"` (white), `filter:drop-shadow(0 -3px 12px rgba(10,10,11,0.08))`. Its raised **centre FAB is *near-black*, not brass**: `width:54px;height:54px;border-radius:50%;background:var(--action-primary);color:#fff;box-shadow:var(--e4)` (the "Add lead" +). There is **no brass/gold anywhere in the system** — the only brass-ish literal in the whole set is `#c8a2…` in `PanelLayout.dc.html` (panel/roof render tint, not a token). Treat "brass centre" as a mischaracterisation: the arc's centre is `#0A0A0B`.

**Primary buttons — confirmed near-black.** Both the `Button` component (`variant:primary → --action-primary`) and hand-rolled CTAs use `var(--action-primary)` #0A0A0B with #fff text (MyDay FAB, DesignStudio toolbar `--action-primary` ×11). Accent `#5A4BFF` is reserved for focus/links/selected/active nav — never a button fill.

**Status chips.** Hand-rolled but faithful to `StatusChip` spec: semantic `-bg` fill + `{semantic}` text + 6px same-colour dot, pill. Leads uses `var(--neutral-bg)`, `var(--accent-subtle)`+`var(--accent)` (Approved), `var(--danger)` (on-hold), etc. Filter chips (Leads `Chips`) go **`--action-primary` fill / #fff when active** (matching `Chip` active spec), white+`--e1` at rest.

**Data colours.** Chart palette is used **sparingly — only 7 of 80 files** touch `var(--chart-*)`: OwnerDashboard(5), PipelineFunnel(3), RepDashboard(2), PropMetricStep(2), DesignStudio(2), CustomerPage(1), BomView(1). None of MyDay/Leads/ProposalStep3. DesignStudio's health ring is a `conic-gradient({ht.color} {score*3.6}deg, var(--neutral-bg) 0deg)` — semantic colour, not chart palette.

**Canvas / "dark studio" surfaces — reality: there is NO dark studio.** `tokens/base.css` sets `:root{color-scheme:light}` and **no mockup declares `color-scheme:dark`, `prefers-color-scheme:dark`, or `data-theme="dark"`**. DesignStudio's canvas/workspace is **light**: `background:var(--canvas)`#F6F7F9 and `var(--canvas-sunken)`#EEF0F3 wells, `var(--surface)` panels, with `var(--action-primary)` near-black only for the toolbar/chips/controls. The lone near-black *background* literal in the entire set is `background:#0A0A0B` ×1 in `CustomerPage.dc.html` (a small element, not a page surface).

**Raw hex OUTSIDE the token system (5 samples).** Minimal and benign — almost all are `#fff` (white, ~10–12 per file) used inline instead of `var(--surface)`, plus a handful of **ultra-light brand-wash tints** that aren't tokens:
- MyDay: `#FCFBFF`, `#F4F1FF`, and a literal `linear-gradient(180deg, #F4F1FF 0%, #FCFBFF 78%)` (violet-white hero wash).
- ProposalStep3: `#FBFAFF`, `#F1EEFF` (violet tints).
- Leads: `#ECEEF1`, `#F7F8FA` (neutral tints).
- DesignStudio / CustomerProposal: **no stray 6-digit hex** beyond `#fff`.
These violet `#F*F*FF` washes are the only recurring off-token colours — hand-mixed near-white brand tints substituting for a missing "brand-wash" token.

---

## 4. Density modes (Expressive vs Functional) in practice

**The `data-mode="expressive"|"functional"` attribute is NEVER set in any mockup** (0 hits). The DS `:root[data-mode="expressive"]` theme and the `--rf-*` functional-radius tokens are **not wired up in usage** — `--rf-*` appears **0 times**, and `var(--r-*)` radius tokens appear only ~6 times total (`--r-pill` ×3, `--r-input-expressive` ×3). Radius is instead **hard-coded in raw px**:

`border-radius` px frequency: **999px ×540** (pill), 12px ×242, 16px ×224, 14px ×181, 20px ×91, 11px ×90, 22px ×86, 24px ×70, 44px ×55, 18px ×55, 10px ×48, 32px ×45, 8px ×16.

So density is expressed **by convention, per frame, not by a mode switch**:
- **Expressive (mobile, 375px — 56 files carry a 375 hint):** large radii — 24px cards, 20–22px tiles, 44px full-screen overlays (`border-radius:44px` in MyDay detail overlay), 14px inputs, 999px pills/FABs; roomier padding.
- **Functional (desktop, 1440px — 56 files carry a 1440 hint; 33 files use the 260px sidebar / grid layouts):** tight radii — 8/10/12px on tables, rows, dense cards; the 600-weight micro-labels concentrate here (Project Flow, RoofSetup, SurveyReview, CatalogPriceBook, Components). Leads renders its desktop pipeline table this way.

Most mockups are **dual-frame** (both a 375 mobile and a 1440 desktop composition in one `.dc.html`), applying the two radius/padding regimes side-by-side rather than toggling a token mode. `CustomerProposal` explicitly frames CustomerPage at both `375px,812px` and `1160px,860px`.

---

## 5. Devanagari / Hindi (and Marathi)

**Yes — 5 mockups render Devanagari:** `CustomerPage.dc.html` (12), `MessageTemplates.dc.html` (8), `ProfilePreferences.dc.html` (7), `CustomerProposal.dc.html` (3), `AgentTest.dc.html` (2).

- **MessageTemplates** is genuinely **tri-lingual**: header reads *"Copy-paste wording for WhatsApp · English · हिंदी · मराठी"*; template objects carry `en` / **`hi`** (Hindi) / **`mr`** (Marathi) strings, e.g. `hi: 'नमस्ते {name}, सूर्योदय सोलर की ओर से आपके {size} सिस्टम का सोलर प्रस्ताव …'` and `mr: 'नमस्कार {name}, सूर्योदय सोलरकडून …'`. So it's actually **3 languages, 2 scripts** (Latin + Devanagari; Hindi and Marathi share Devanagari).
- **ProfilePreferences** ships a full Hindi UI string table (`भाषा हिंदी पर सेट`, `मेरा दिन / लीड्स / प्रस्ताव / प्रोजेक्ट / प्रोफ़ाइल`) toggled by `lang` `en|hi|mr`.
- **CustomerProposal** is a **QA harness** that deliberately stress-tests script coverage: row label `"9 · State A in हिंदी — layout survives Devanagari"`, embedding `CustomerPage` with `lang="hi"` in both mobile (375×812) and desktop (1160×860) frames.

**Font fallback for Devanagari — the ground truth:** there is **no Devanagari font anywhere**. No `@font-face` in any mockup; no `Noto`, `Mukta`, `Hind`, or `Devanagari` family is bundled or referenced (the earlier keyword hits were false — "behind" matching `hind`, `notOptional` matching `noto`). The Hindi/Marathi text carries **no `font-family` override**, so it inherits `--font-sans = "Geist","Inter",-apple-system,system-ui,sans-serif`. **Geist and Inter have no Devanagari glyphs**, so rendering falls through to **`-apple-system` / `system-ui`** — i.e. the OS's default Devanagari face (Kohinoor Devanagari on Apple platforms, Nirmala UI on Windows). Devanagari is therefore rendered **entirely by system fallback, not by a bundled webfont**, and the design explicitly acknowledges this by testing that "layout survives Devanagari."

---

## Appendix — motion (correction to manifest)

The manifest reports `--dur-*: 1ms` because it captured the `@media (prefers-reduced-motion:reduce)` override. The **real durations** (`tokens/motion.css`): `--dur-micro:120ms, --dur-standard:200ms, --dur-emphasised:320ms, --dur-ambient:500ms`; eases `--ease-standard:cubic-bezier(0.4,0,0.2,1)`, `--ease-enter:cubic-bezier(0,0,0.2,1)`, `--ease-exit:cubic-bezier(0.4,0,1,1)`, `--ease-spring:cubic-bezier(0.34,1.56,0.64,1)`. Elevation is felt-not-seen: `--e1:0 1px 2px rgba(16,24,40,0.04)` → `--e5:0 24px 72px rgba(16,24,40,0.10)`.