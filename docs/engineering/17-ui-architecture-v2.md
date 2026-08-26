# 17 — UI architecture V2

**Status:** approved direction, not yet built. Written 2026-08-19.
**Scope:** the UI layer only — tokens, theme, components, and the two apps' screens.
**Out of scope, do not touch:** `packages/domain`, `data`, `contracts`, `db`, `env`, `config`,
`i18n`, `forms`, and `apps/api` / `apps/worker`. Those are ~1,100 lines of working
backend/shared code and no part of this document changes them.

---

## 1 · Why we are replacing, not refactoring

The v1 UI layer implemented a 21-component snapshot of the design system. The live design
system (Claude Design project **HelioGrid Design System**,
`c8aa4326-21bf-453a-8d11-749cc81dee12`) had already grown well past it through design rounds
13–17, and the v1 layer still carried components for capabilities the product no longer has —
an `OfflineBanner` under parity contract on both platforms, after owner ruling **Q61**
(2026-08-07) removed the offline capability entirely.

Refactoring would have preserved that drift. So the layer was replaced rather than refactored:
`packages/theme` and `packages/ui` are the result.

### The failure to design out

The v1 snapshot was a hand-copy of the design system. It went stale within days and
produced at least one false audit finding. **Any hand-copied mirror of the design system
will drift.** §6 is the mechanical answer to this, and it is the most important section
in this document.

---

## 2 · Target layout

```
packages/
├── theme/                       # tokens + semantic layer + provider. ONE package.
│   ├── src/
│   │   ├── _generated/          # WRITTEN BY SCRIPT. Never hand-edit.
│   │   │   ├── tokens.json      #   pulled from the live design system
│   │   │   └── manifest.json    #   component + prop census, for the drift gate
│   │   ├── semantic.ts          # raw token -> role mapping (bg-page, text-body, …)
│   │   ├── theme.native.ts      # Unistyles theme registration
│   │   ├── provider.tsx         # web provider (density mode, locale direction)
│   │   └── index.ts
│   ├── dist/
│   │   ├── tokens.css           # web: CSS custom properties
│   │   └── print.css            # web: @page rules (design gap 32)
│   └── build.ts
│
├── ui/                          # ONE component package. Both platforms live here.
│   └── src/
│       ├── primitives/          # ~8 atoms. Every component is built from these.
│       ├── components/
│       │   └── Button/
│       │       ├── Button.types.ts     # the shared contract — single source
│       │       ├── Button.tsx          # web implementation
│       │       ├── Button.native.tsx   # React Native implementation
│       │       ├── Button.css          # web only
│       │       └── index.ts
│       └── index.ts
│
└── icons/                       # LATER. One SVG source -> RN + web. Not phase 1.
```

**Dependency direction:** `theme → ui → apps`. Nothing flows back up. No app imports
another app. `ui` never imports `domain`, `data`, `contracts`, navigation, or anything
that makes a network call.

### Why `theme` is one package, not `design-tokens` + `theme`

Splitting raw values from semantic values pays off only when a non-React consumer needs
the raw set. We have none — print CSS consumes the emitted stylesheet, which `theme`
exports as a subpath. Two packages here would be two versions, two import paths and two
build steps for one artifact.

### Why the web file is `Button.tsx` and not `Button.web.tsx`

Metro resolves `.native.tsx` ahead of `.tsx` automatically, with no configuration.
Webpack and Turbopack never look for `.native.*` at all, so they take `Button.tsx`.

Naming the web file `Button.web.tsx` instead would require a custom `resolve.extensions`
in **both** the webpack and the Turbopack config, and getting it wrong fails at runtime
rather than at build time. Use `.tsx` + `.native.tsx`. No web config needed.

### Why the three-copy problem disappears

The v1 layer wrote the same prop list three times and needed a 200-line script to keep the
copies equal. With `Button.types.ts` co-located, both platform files import the one
declaration. Divergence is a type error, not a script's job.

`scripts/check-ui-parity.mjs` is deleted. Its replacement checks something else — see §6.

---

## 3 · Styling: two technologies, one token set

**Do not force one styling technology across platforms.** Share the tokens, the prop
contract and the behaviour. Let each platform render idiomatically.

### Web — plain CSS files + CSS custom properties

The design system's own source is CSS custom properties, so the repo mirrors it exactly.
No runtime cost, no build plugin, no translation layer. Radix stays underneath for focus
management and roving tabindex.

Do not introduce Tailwind or CSS-in-JS. There is nothing to gain and a token-shaped
system fights a utility-shaped one.

### React Native — `react-native-unistyles` v3

Recommended over hand-rolled `StyleSheet` + prop arrays, for three reasons that only
matter at this scale:

1. **`variants` / `compoundVariants`** map 1:1 onto the design system's prop enums
   (`Button` primary/secondary/ghost/destructive × lg/md/sm). Across ~100 components this
   removes a large amount of `[styles.base, v === 'primary' && styles.primary]` wiring.
2. **Theme swap without re-render** — density mode (Expressive / Functional) is a
   product-wide switch, not a per-screen prop.
3. It consumes a **plain theme object**, which is exactly what `theme/build.ts` emits.

Cost to accept knowingly: a Babel plugin and a real dependency. RN 0.86 is supported.

If the new session judges the dependency not worth it, plain `StyleSheet` plus a small
`useStyles` helper is a legitimate fallback — but make that call explicitly and write
down why, do not drift into it.

---

## 4 · The primitives layer

~100 components must sit on ~8 primitives. Building 100 flat shells repeats the same
padding, focus ring and touch-target logic 100 times, and that is precisely how the
design-system gap register filled up.

| primitive | responsibility |
|---|---|
| `Box` / `Stack` | layout, spacing scale, direction |
| `Text` | the type scale, including the overline micro-label |
| `Pressable` | **the 44px minimum touch target**, focus ring, pressed state |
| `Surface` | elevation, radius, density mode |
| `Field` | label + hint + error + required, shared by every form control |
| `StatusMark` | **status as label + mark, never colour alone** |
| `Icon` | sizing, currentColor, a11y role |
| `Portal` | sheets, modals, menus, tooltips |

Two of these encode product law rather than style:

- **`Pressable`** owns the 44px minimum. A component cannot ship a small target by accident.
- **`StatusMark`** owns `F7-12` — status is never carried by colour alone. Design gap 23
  is exactly this law broken inside one component (`BandedFigure`'s warning mark measured
  1.99:1 against its tint, making the second channel invisible). One primitive means that
  defect has one place to live and one place to fix.

Build the primitives before any component. They are ~8 files × 2 platforms.

---

## 5 · Build order

1. **`packages/theme`** — pull tokens, emit `tokens.css` + `print.css` + the typed theme,
   add the contrast gate. Depends on nothing.
2. **`packages/ui/primitives`** — the 8 atoms, both platforms.
3. **Delete the old layer** — the v1 UI and token packages, `apps/mobile/src/ui`,
   `scripts/check-ui-parity.mjs`, and the two gallery screens
   (`apps/web/features/design-reference/`, `apps/mobile/src/screens/gallery/`). The
   galleries exist only to display the v1 components; they are not migrated.
4. **Components, in the order the screens need them.** Not alphabetically, not all at
   once. The V1 screen list is `docs/prd/registers/screens.md`,
   99 screens, block 1 first.
5. **Rebuild the four existing flows** — login, signup, onboarding, home — on the new
   system. Roughly 7,600 lines of app code exists today; about 40% of it is gallery and
   is deleted rather than ported.

**Do not build all ~100 components before drawing screens.** Each drawn screen tells you
which components it uses and in what form. Building ahead of that is what produced the
57-gap register the first time.

---

## 6 · The drift gate — the part that must not be skipped

Three scripts, all mechanical.

**`pnpm ds:pull`** — fetches the live design system's tokens, component manifest and
per-component typings (as `.d.ts.txt`) into `packages/theme/src/_generated/`. Output is committed.
Hand-editing anything in `_generated/` is a bug.

**`pnpm ds:check` was removed 2026-08-25.** It compared the census — names and file presence —
and reported everything not yet built as informational, so with the components absent entirely it
printed `OK — no drift` and exited 0. It was never a lint gate and never ran in CI, so it blocked
nothing; what it did do was report success over an empty repo. **Nothing now checks that a
component has its four files.** `ds:contract` (gate 6) still checks what the files MEAN. It
formerly reported three lists:

- in the design system, not in the repo (not yet built — expected during phase 4)
- in the repo, not in the design system (**stale — a component that was removed, like
  `OfflineBanner`**)
- present in both, but the port is structurally incomplete (**drift — the dangerous one**)

CI fails on the second and third lists. The first is informational while the component
build is in progress.

**`pnpm ds:contract`** — the same comparison one level down, and **lint gate 6 of 6** in
`scripts/lint-all.sh`. Where `ds:check` used to ask whether the component *exists* and has its
four files, `ds:contract` asks whether its **props mean what the design system says they mean**, whether
the comments explaining a shortfall are **true**, whether its native accessibility markup
**does what it claims**, and whether its **two platform halves say the same thing**. It reads
`packages/theme/src/_generated/contracts/<family>/<Name>.d.ts.txt` (typings, so prop *types*;
`.txt` because they are DATA read as text — see `_generated/README.md` for why),
unioned with the `Declared props:` allowlists in `adherence.oxlintrc.json` (names only), and
every `.ts` / `.tsx` under `packages/ui/src`. The entry point is thin; the checks live in their own
modules under `scripts/ds-contract/`, each with its own header stating what it catches and what it
cannot see:

| Module | Check |
| --- | --- |
| `contracts.mjs` | (a) WEAKENED, (b) DROPPED, (c) RAW EMIT |
| `excuses.mjs` + `excuse-vocabulary.mjs` + `excuse-index.mjs` | (d) FALSE EXCUSE, name-shaped |
| `capability-claims.mjs` | (d) FALSE EXCUSE, capability-shaped |
| `native-a11y.mjs` | (e) INERT A11Y |
| `native-fold.mjs` | (f) FOLDED CONTROL |
| `native-role.mjs` | (g) DISHONEST ROLE |
| `semantic-parity.mjs` + `parity-{vocabulary,roles,exemptions,declarations}.mjs` | (h) SEMANTIC DRIFT |
| `jsx.mjs`, `lib.mjs` | shared text scanning — no check of their own |

Every one of those files is under the repo's own 300-line law (§8), and that is not decoration: the
three-module layout it replaced put `native-a11y.mjs` at 421 lines and `excuses.mjs` at 310, so the
gate that enforces `pnpm lint` was breaking `pnpm lint`. A gate that breaks the repo's law while
enforcing other laws has no standing. The split was by RESPONSIBILITY — one check, or one table, or
one scanner per file — never `*-part2`.

It fails on **eight** findings:

| Finding | What it catches |
| --- | --- |
| **(a) WEAKENED** | The design system types a prop as one of the four spec unions — `ProvenanceProps \| ProvenanceTierSpec`, `NamedGapSpec`, `ValueSourceSpec`, `PendingActionSpec` — and the port types it as a bare `ReactNode` or anything else that mentions none of them. |
| **(b) DROPPED** | The design system declares a prop the port declares nowhere: not in `<Name>.types.ts`, not in the platform-local `Web<Name>Props` / `Native<Name>Props`. `style` and `className` are exempt — that split is §2's own rule, not drift. |
| **(c) RAW EMIT** | The component imports a spec type but its folder has no use site for the matching renderer (`renderProvenance(`, `renderGap(`, `renderAttribution(`, `renderPending(`, or `<Provenance>` / `<NamedGap>` / `<ValueSource>` / `<PendingAction>`). The type came across, the renderer did not. |
| **(d) FALSE EXCUSE** | Two resolvers, one heading. **Name-shaped:** a comment excuses a shortfall — 24 phrasings including "belongs to the …", "is not in this folder", "does not own", "until … lands", "for now", "stand-in", "TODO", "cannot yet", "no market pack", "nothing to read", "no route", "this platform has no", "deliberately not read", "pretends", "not wired" — and names something that **already exists**: a `components/<Name>/` folder, or a symbol exported anywhere in the package. Fourteen porting agents wrote a variant of "that component belongs to another family, so this contract keeps the node form only"; **all fourteen were false**. Cross-folder imports happen ~100× in this package. Exempt: the folder already **binds** the name in an import (attribution, not an excuse), and a phrase inside `"double quotes"` (a citation of a removed note). **Capability-shaped** (round seven, `capability-claims.mjs`): 7 further phrasings — "primitive carries no", "primitive fixes", "the primitive has no", "carries no checked", "carries no selected", "no role prop", "hard-codes" — checked not against the name index but against `primitives/Pressable/Pressable.types.ts`, READ each run rather than copied. See the box below for why these needed a second resolver. |
| **(e) INERT A11Y** | `accessibilityState` / `accessibilityLabel` / `accessibilityValue` on a React Native `<View>` (or `<Animated.View>`) with **no `accessible` and no role** (`accessibilityRole`, or its RN 0.71+ alias `role`). The View is not an accessibility element, so nothing is announced. Four live defects here: DataTable rows, DataTable cards, Kanban cards, the DataTable native grid caption — and **twice** a repair pass "fixed" a defect by writing this exact inert form. `accessible={false}` does not satisfy it. |
| **(f) FOLDED CONTROL** | `accessible` (bare or `={true}`) on a node whose **subtree contains a focusable control** — `Pressable`, `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`, `TouchableNativeFeedback`, `Button`, `TextInput`, `Switch`, or anything carrying `onPress` / `onLongPress`. `accessible` folds the subtree into one element, so every control inside becomes **unreachable**. This is (e)'s counter-trap, and it shipped LIVE twice — `Image/ImageStates.native.tsx` folding a 44dp retry `Pressable`, `QRCode/QRCode.native.tsx` swallowing its own fallback link — *after* a repair round was explicitly warned about it in prose. The node's own attributes are excluded: `<Pressable accessible onPress>` with nothing focusable inside is the correct shape. |
| **(g) DISHONEST ROLE** | `accessibilityRole="progressbar"` (or `role="progressbar"`) with **no `accessibilityValue`** on the same element. `progressbar` promises a measurable position; with no value there is nothing to announce. Twenty native files declared it on an **indeterminate** loading skeleton while the web half of the same component announced `role="status"` — the two halves disagreeing about what the component *is*. |
| **(h) SEMANTIC DRIFT** | The two platform halves of one component declare **different accessibility vocabularies**. Each `<Base>.tsx` is paired with `<Base>.native.tsx` by basename (split siblings included; an unpaired file falls back to the folder's other-platform union), and eight members are compared **in both directions**: `role="X"` ↔ `accessibilityRole`; `aria-checked` ↔ `accessibilityState.checked`; `aria-selected` / `aria-pressed` ↔ `.selected`; `aria-expanded` ↔ `.expanded`; `aria-busy` ↔ `.busy`; `aria-disabled` ↔ `.disabled`; `aria-label` / `aria-labelledby` ↔ `accessibilityLabel`; and `aria-live` ↔ `accessibilityLiveRegion`, which is **informational only** — see (h·i). **Round seven found nine defects and SEVEN were this one shape** — `Switch`, `FieldModeToggle`, `OptionCardGroup`, `Tabs`, `Checkbox`, `ListRow`, `SegmentedControl`, `CompareGrid`, `Menu`, `LanguageSwitcher` — the web half declaring a role and a state, the native half declaring neither, so the control announced as a plain button and its state was carried by **colour alone** (F7-12). Both spellings count on either half, because a correctly ported control declares `accessibilityRole` / `accessibilityState` on **both** halves and lets `Pressable` map them. |

**(d·i) REAL GAP** is informational and never fails the gate: an excuse phrasing whose name
resolves to *nothing* in the package — or, for a capability claim, a capability the primitive
genuinely does not have (`link` is deliberately absent from `PressableRole`). That comment is the
only record of a genuine gap, so it is printed rather than swallowed — a passing run should not
make the gap invisible. Widening the (d) vocabulary is safe for exactly this reason: a new phrase
beside an absent name lands here, not in the failing list. Only a phrase beside a name — or a
capability — that **exists** can fail the gate.

**(h·i)** is informational for one member and one structural case. `aria-live` ↔
`accessibilityLiveRegion` is reported and never failed because `accessibilityLiveRegion` is
**Android-only**: iOS has no equivalent prop, VoiceOver announces through
`AccessibilityInfo.announceForAccessibility`, and that is an imperative call, not a declaration, so
no lexical check can see it. Absence on either side therefore proves nothing. A folder with web
files, no `*.native.tsx` and no waiver marker is also informational — and since `ds:check` was
removed, nothing owns it.

**Why the round-seven excuse family needed a SECOND resolver, not more phrases.** The primitive
change that landed `accessibilityRole` and `accessibilityState` on `Pressable` falsified a whole
family of comments in one stroke: *"the Pressable primitive carries no expanded state"*
(`Accordion.native`), *"the primitive fixes `accessibilityRole="button"` and carries no `checked`"*
(`Checkbox.native`), *"the primitive fixes the role"* (`Radio.native`), and eight more. Every one
of them names a **capability**, not a component — so the name index had nothing to answer, and
`Pressable` itself resolved and was then thrown away by the import exemption, because a folder that
writes `<Pressable>` binds the name. Both halves of (d)'s machinery were working exactly as
designed. `capability-claims.mjs` asks a different question of a different source: it READS
`PressableProps`, `PressableAccessibilityState` and the `PressableRole` union out of
`Pressable.types.ts` each run, so deleting a prop there makes the matching claim true again with no
edit to the check. It is scoped to `Pressable` by name and stands down when a sentence's subject is
a different primitive (*"the Text primitive carries no a11y role"* is true, and about a file this
check does not read).

**(h)'s exemptions are enumerated, counted and PRINTED on every run** — green or red — in
`parity-exemptions.mjs`. A gate this broad is mostly exemptions, and an exemption written as an
unlabelled `continue` is one nobody can audit. Twelve are sanctioned: `WAIVED_SURFACE` (no native
half, waived by the `PRINT SURFACE` / `POINTER SURFACE` markers in the component's own
types-file header), `NO_RN_ROLE` (`status`, the landmark roles, `group`, `presentation` — no React
Native partner exists; the honest native form for `status` is a labelled live region, which is
(g)'s point), `NO_WEB_ROLE` (`text`, `keyboardkey`, `none` — not ARIA words), `ROLE_IN_ELEMENT`
(the web half carries the role in its **element**: `<button>` IS a button, `<ul>` IS a list, and
naming it again is what the ARIA redundancy lint forbids), `ROLE_NORMALISED` (`menuitemradio` →
`menuitem` + `checked`, `img`↔`image`, `slider`↔`adjustable`, exactly as `Pressable.native`'s own
`NATIVE_ROLE` map does it), `PRIMITIVE_DEFAULT_ROLE` (`Pressable`'s `accessibilityRole` defaults to
`button`, so neither half has to write it), `DISABLED_FROM_PROP` (a plain `disabled` prop announces
off on both platforms; `aria-disabled` is for the off-but-still-reachable case, which no lexical
check can separate), `STATE_IN_ELEMENT` (`<input type="checkbox">` announces checked, `<option>`
selected, `<details>` expanded), `NAME_FROM_CONTENT`, `OPAQUE_STATE`, `OPAQUE_ROLE` and
`LIVE_REGION`.

**(e) and (f) are one pair, and shipping (e) alone was a mistake.** (e) teaches the repair
"add `accessible` to the wrapper", which is the *worse* defect: `accessible` folds the whole
subtree into ONE element, children stop being separately focusable, their labels concatenate,
and any 44dp control inside — a row's tick, a retry, a fallback link — goes out of reach of the
screen reader entirely. That trades a silent state for an unreachable control. The correct fix
for both is the same: the label belongs on the node that **already is** the accessibility
element — the `Pressable` / `Touchable` / `Text` the user lands on, or a child View that carries
a role and holds no control — and the wrapper stays unnamed so its children remain individually
reachable. If the grouping itself must be announced, that is a `role` on the wrapper, never
`accessible`. This paragraph existed, in almost these words, in `native-a11y.mjs`'s header
before the two live defects were written. It was read, agreed with, and violated anyway.
**Prose in a header is not a gate.** That is the whole argument for (f).

**Why the round-six excuse miss was not a vocabulary problem.** The live excuse in
`TimeField/time-parse.ts` — "that provider **is not in this folder**, so … a 12-hour market
**cannot yet** be honoured" — used a phrase the list *already contained*, next to a name
(`MarketProvider`) that plainly resolved. It was thrown away by the **import exemption**, which
used to read every word of an import *statement*, module specifier included: because a sibling
file wrote `import { useFormat } from '../MarketProvider/market-context'`, the path segment
`MarketProvider` counted as "imported" for the whole folder. Only **bound names** exempt now. A
folder that imports a sibling's file is not thereby excused from every sentence about that
sibling.

**Why the round-seven miss was not a vocabulary problem either, and why (h) is different.** Seven
of round seven's nine defects were *one* shape, spread across ten components, and every one of them
was two files disagreeing with each other. No check in (a)–(g) ever opened both halves of a
component at once — each one reads a single file, or a single tag inside one — so the entire class
was structurally invisible no matter how many phrases or props were added to the existing checks.
(g) was the near miss: it caught the one case where the disagreement leaves a signature inside a
single tag (`progressbar` with no value, while the web half said `status`) and its own header
already named the real problem — "the two halves disagreed about what the component IS". (h) is
that sentence turned into a check.

**Why the shape gates could not catch this.** Audit rounds found ~36 behaviour defects
in `packages/ui` while build, typecheck, biome, dependency-cruiser, sherif, adherence, env,
boundaries and `ds:check` were all green — because every one of them measures shape. A prop
flattened from `ProvenanceProps | ProvenanceTierSpec` to `ReactNode` still typechecks
(`ReactNode` is a legal type), still lints, still lives in a component with all four files, so
`ds:check` sees a complete port. The defect only surfaces at runtime, when a caller passes the
object the design system documents, the component emits `{value}` raw, and React is handed a
plain object as a child. The same is true of the other two: no gate reads prose, so no gate can
call a false excuse; and inert accessibility props typecheck, lint and render, with no runtime
warning and nothing visibly wrong in review. `ds:contract` is the only gate here that compares
meaning rather than structure, and the `.d.ts` contracts are what make (a)–(c) possible: the
adherence config knows prop *names*, and names alone cannot tell you a type was weakened.

### What the three ds-* scripts still cannot see — and the running score

**SEVEN audit rounds have run against this package. Every single one found something the gates in
place at the time did not.** That is the honest record, it is the reason this section exists rather
than a coverage claim, and it is the number to weigh a green run against. The running count:

| Round | Gates green at the time | Defects found | Of those, mechanically catchable and missed | Check added in answer |
| --- | --- | --- | --- | --- |
| 1–4 | build, typecheck, biome, dep-cruiser, sherif, adherence, env, boundaries, `ds:check` | ~18 cumulative | the weakened/dropped/raw-emit props | (a), (b), (c) |
| 5 | + `ds:contract` (a)–(c) | — | the false-excuse comments (14 of them, all false) | (d) |
| 6 | + (d) | 9 | 3 — the fold, a widened excuse, the dishonest role | (e)→(f), (g), (d) widened/narrowed |
| 7 | + (e), (f), (g) | 9 | **7 — all one shape: web/native semantic drift** | **(h), (d) capability-shaped** |

Read that last row as the argument for scepticism, not for confidence. Round seven's seven were not
an exotic class: they were ten components where one file said `role="switch" aria-checked` and its
sibling said nothing, sitting in the tree while eight gates ran green. **Every round so far has
added a check and the next round has still found something.** There is no reason to expect round
eight to come back empty, and this list is *what is currently unwatched*, never *what is left*.

Each script's header carries the long version; this is the short one.

**`ds:pull`** takes the design system at its word. It cannot tell you the live DS changed under
a component you already ported, only that the committed snapshot is what the DS served at pull
time. Nothing verifies the snapshot is current except running it again.

**Census checking is unowned since `ds:check` was removed 2026-08-25.** Nothing verifies that a
component has its four files with the right names. The two waivers (`PRINT SURFACE`,
`POINTER SURFACE`) survive as a closed vocabulary read by `ds:contract`, precisely so the gate
does not become a grep for excuses.

**`ds:contract`** reads TEXT — no TypeScript program, no JSX parser. Specifically:

- **(a)–(c)** read *declarations*, not renders, so one `renderProvenance(` call satisfies (c)
  even if a second spec prop is emitted raw two lines below. Props the DS inherits across
  contract files (`extends Omit<OperationProgressProps, …>`) and method shorthand
  (`onX(): void`) are invisible, so (b) under-reports. A prop reaching a spec through a mapped
  or conditional type reads as weakened — a false positive; widen the resolution, never silence
  the check.
- **(d)** reads *comments only*, against a closed phrase list — 24 name-shaped phrasings plus 7
  capability-shaped ones now, but still closed, and still a record of the wordings seven rounds
  happened to use. A false excuse worded outside it, or expressed as a shrug in a variable name, is
  invisible. Candidate names must be **Capitalised**: a lowercase export such as `useFormat` is
  never a candidate at all, so an excuse about a hook is unseen no matter how it is phrased. It
  cannot tell you an excuse is **true** — resolving a name proves the thing exists, not that this
  component should use it, so a finding is a claim to check, not a defect proved. The import
  exemption is narrower than it was but still real: a folder that binds a *type* from a sibling and
  then excuses the *value* form goes unseen. The capability resolver reads **one primitive**,
  `Pressable`: an equally false claim about `Field`, `Text` or `Surface` is unseen, and it requires
  the sentence to name `Pressable` — deliberately, because without that requirement "hard-codes"
  matches every sentence in the package about a CSS value.
- **(e)** covers `View` and `Animated.View` only. A package wrapper that forwards to a View
  (`<Surface>`, `<Box>`) is invisible, and a tag carrying `{...spread}` is **skipped** — the
  spread may supply `accessible` from the caller, so `{...rest}` is a real hiding place. The
  `aria-*` aliases (`aria-label`, `aria-busy`, `aria-selected`) are equally inert on a roleless
  View and are **not** triggers. And it cannot judge whether a View that correctly carries a
  role announces the right thing.
- **(f)** would have caught only **one of the two live defects that motivated it**, and this was
  measured by injection rather than assumed. `Image/ImageStates` fires; `QRCode` does **not**,
  because the content it folded is a local `<LinkText>` rendering `<Text>` — selectable copy,
  not a focusable control. So: folding **non-control** content is a real defect that (f) calls
  clean; a control rendered by a package component one file away (`<RetryAction>`, `<Chip>`,
  `<LinkText>`) is not followed; a control passed in as `children` or through a `renderX` prop
  is not followed either, and that is the likeliest remaining hiding place; and `accessible`
  arriving via `{...spread}` or written as an expression (`accessible={alt !== ''}`) is not read
  at all.
- **(g)** matches a **literal**, so a role computed into a variable
  (`accessibilityRole={busy ? 'progressbar' : 'none'}`) is invisible. Worse, and entirely
  outside it: carrying an `accessibilityValue` is not the same as being determinate. A tag with
  `accessibilityValue={{ now: 0, min: 0, max: 0 }}`, or a frozen constant, or the wrong
  quantity, passes. (g) proves the promise is not *empty*; it never proves it is *kept*.
- **(h) IS A LEXICAL CHECK OVER DECLARATIONS. IT IS NOT A PROOF THAT THE RIGHT NODE CARRIES THEM,**
  and that sentence is in the finding text as well as here because it is the whole shape of the
  hole. It reads the *words* each file contains. It does not know which element a declaration sits
  on, that the two halves put it on the **same** element, that the value is computed from the same
  state, or that it is reachable at all: a web half with `aria-checked` on a hidden input and a
  native half with `accessibilityState={{ checked }}` on a decorative `<View>` both "declare
  checked", and (h) calls that pair clean. Presence is not truth either —
  `accessibilityState={{ checked: false }}` hard-coded satisfies `checked`. A declaration reached
  through a package wrapper is not followed (so `OperationHead`'s native half, which delegates
  `progressbar` to `<ProgressBar>`, reports as a false positive), a `{...spread}` is not read, and
  a computed role or a variable `accessibilityState` suppresses its own comparison rather than
  guessing. **Accessible names are its weakest member** and are reported as claims, not defects: on
  the web a name usually comes from element *content*, on native from a `<Text>` child, so absence
  of the attribute proves nothing and only the icon-only case is genuinely decidable. The role
  comparison depends on a hand-written ARIA↔RN table (`parity-roles.mjs`) and an implicit-role table
  for semantic HTML — a role missing from either reads as no role at all.

Every ambiguity above resolves toward **under-reporting**, on purpose — a gate that invents work
gets muted, and a muted gate catches nothing.

**And this is the part no table can shrink.** The eight checks close eight
mechanically-detectable *shapes*. They say nothing about defaults, focus order, tab order,
tokens, copy, state transitions, loading and error behaviour, or gesture targets — the majority of
what seven rounds of audit found. (h) now looks at *whether the two halves agree*, which was named
as an unwatched category in this paragraph before round seven found seven defects in it; it agrees
only about the eight words in its vocabulary, and only that both files say them. Nothing here reads
what a component *does*. **A green `ds:contract` means eight specific mistakes are absent. It is
not a reviewed component, and it never has been.**

### The two native waivers

List 3 requires four files per component — `<Name>.types.ts`, `<Name>.tsx`, `index.ts` and
`<Name>.native.tsx`. The native half is waived by exactly one of two markers, declared in the
first 1500 characters of the component's own `<Name>.types.ts` header:

| Marker | What it asserts | Declared by |
| --- | --- | --- |
| `PRINT SURFACE` | The component renders paper. `@page`, 96dpi sheet geometry and print scoping have no React Native equivalent, and a phone never produces the artefact. | `DrawingSheet`, `PagedDocument` |
| `POINTER SURFACE` | The design system gives the component no phone form **and** the phone shell has no slot to host one, so a native half would be an invention rather than a port. | `Breadcrumb` |

Both are stronger claims than "not ported yet" — that case belongs in list 1. `POINTER SURFACE`
in particular needs the design system to say so in its own words *and* the mobile shell to
corroborate it; `Breadcrumb` qualifies because its DS source reads "desktop only … never a
trail" and `AppShell`'s `AppHeader` has a `breadcrumb` slot while `MobileTopBar` has none.

The vocabulary is closed on purpose. Matching free text — "desktop only", "N/A on mobile" —
would turn the gate into a grep for excuses and let every unported component talk its way out.
The markers are enumerated in `WAIVERS` in `scripts/ds-contract/semantic-parity.mjs`, so
`git grep 'POINTER SURFACE'` lists every component claiming one. Adding a third kind means
editing that array and justifying it in review.

This is the direct replacement for `check-ui-parity.mjs`. That script kept three copies
of the same list equal to each other; it could not tell you that all three were wrong.
This one compares the repo to the design system, which is the comparison that matters.

---

## 7 · Repo files that reference the old layer

Each needs updating when phase 3 lands. Listed so none is missed:

- `package.json` — remove the `check:ui-parity` script, add `ds:pull` and `ds:check`
- `.dependency-cruiser.cjs` — package boundary rules naming `ui` / `ui-api` / `tokens`
- `knip.jsonc` — entry points for the deleted packages
- `apps/web/next.config.ts` — `transpilePackages: ['@heliogrid/ui', '@heliogrid/theme']`
  **done 2026-08-25 (task 2)**
- `apps/mobile/babel.config.js` — add the Unistyles plugin if §3 is taken
- **hardcoded English in `packages/ui` — 78 occurrences / 46 unique strings across 64 files
  (measured 2026-08-25).** Mostly `aria-label` / `accessibilityLabel` pairs, which a screen
  reader speaks and which are therefore copy. Each becomes a REQUIRED prop on the
  component's one `<Name>.types.ts`, so by Law 7 it changes both platform halves and every
  call site together — a design-system change, sequenced here rather than with the i18n
  track that established the rule. The rule and the regenerating command are in
  `.claude/rules/ui-adherence.md`; `packages/ui` gains no dependency on `@heliogrid/i18n`.
- `docs/engineering/03-tech-stack.md` — the design-tokens row must name `packages/theme`

---

## 8 · Constraints that carry over unchanged

- TypeScript strict, no new `any`
- No deep imports into package internals — apps import from `@heliogrid/ui` and
  `@heliogrid/theme` only
- No business logic, navigation, API calls or app state inside `@heliogrid/ui`
- Keep the repo building at every step; do not land a broken intermediate state
- Metro must resolve workspace packages (`watchFolders` + `nodeModulesPaths` — already
  correct today, do not regress it)
