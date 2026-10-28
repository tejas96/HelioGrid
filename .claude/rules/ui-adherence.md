---
paths:
  - "packages/ui/**"
  - "packages/theme/**"
  - "apps/mobile/src/**"
  - "apps/mobile/App.tsx"
  - "apps/web/app/**"
  - "apps/web/lib/**"
  - "apps/web/features/**"
---

# UI — theme only, compose don't invent, separate rendering from logic

## Visual values

- **No raw values** — no hex, no px, no inline style; every value comes from `@heliogrid/theme`. On
  a screen only `0` is written raw; a size or colour the design system lacks is a design system change
  (`.claude/skills/task/design-track.md`, *Changing the design system*), then pulled into `packages/theme` as
  `packages/theme/CLAUDE.md` says — never typed into the app.
- **Primary actions are near-black.** Accent is focus, links, selection, active tab and control
  fills ONLY — never a button fill. Iridescence is atmosphere, never information. Hierarchy comes
  from luminance and elevation, not borders.
- **Text is never smaller than 12px**; the 11px uppercase overline is the one exception.
- **An icon-only control is an `IconButton`**; a `Button` always has words.

## A screen is its locked board

A screen with locked boards (`.design/<module>/<screen id>-*.dc.html`) is built frame by frame
(`data-frame="…"`) from the frame's markup — the components it names
(`component-from-global-scope="…<Name>"`, `h(NS.<Name>`), their order, nesting and props, and its
layout — never from the names alone. The app shell draws the top bar, nav and rail, and the
words come from the catalog, never from the board. A component the frame does not name, or a
different structure, is a defect even when every test passes.

## Compose from the primitives, don't re-answer them

Every component is built from `packages/ui/src/primitives/`. Two of them hold product law, not
style, and a component that re-implements either is a defect:

- **`Pressable` owns the 44px minimum touch target.** Never re-implement a pressable.
- **`StatusMark` owns "status is never carried by colour alone"** — always a label plus a mark.

**Semantics go through `Pressable`:** a checkbox, radio, tab or menu row passes `accessibilityRole`
and `accessibilityState` to it; reaching for the platform pressable loses the 44px floor and focus
ring.

**Never put `accessible` on a wrapper that holds controls** — it folds them out of the screen
reader's reach; state goes on the node that is the accessibility element.

A surface the design system does not cover is COMPOSED from the existing vocabulary, never new
visuals. **No user-visible English lives in `packages/ui`, accessibility labels included** — a
screen reader speaks an `aria-label`, so a hard-coded one is a Hindi user hearing English. Copy
props are required, never optional-with-a-fallback: a default that "only shows if you forget" is
how untranslated copy ships.

## Traps no check sees

- **A control never renders smaller than it was designed.** A `width` or `height` with a smaller
  `min-width` or `min-height` in a flex row shrinks silently, and the touch check then measures the
  floor and passes. Wrap, or set `flex-shrink: 0`.
- **No container is drawn around content that is absent.** An optional icon, badge or slot renders
  its box only when it has something in it.
- **`white-space: nowrap` and `numberOfLines` belong on NUMBERS, never on caller text.** A number is
  one token and wrapping it is worse than any overflow; a translated string clips, and it holds in
  English and breaks in Hindi and Marathi.
- **`--text-tertiary` is the quiet role.** If a caller depends on reading it, it is
  `--text-secondary` — a state word, a count, a limit and a delivery channel are information.
- **A component never states a value it was not told** — a default that invents a limit, a size or
  a ceiling promises one thing while the caller refuses another.

## States, saves and focus — decided before the markup

The plan names them for each read and each action a screen has (`/task`, *Plan*); the code builds
what the plan names (`F7-23` N5 and N10, `F7-43` items 2 and 3):

- **A read** draws loading, empty and failed. Failed says what happened and offers its retry; a
  part whose read is still out draws its loading, never nothing.
- **An action**, while it is out: its fields and acts are inert, every other way out waits for its
  answer, and a second press sends nothing. Its failure shows where the person acted, never
  swallowed and never only in another part.
- **A control that removes itself or swaps its card** when pressed — *Try again*, *Undo*,
  *Remove*, *Dismiss*, a toast's act — moves focus to where the person goes next: what replaced
  it, else its heading. Both halves do it, through the component's focus handle.

## Motion — calm, and never a dropped frame

What motion is for and its four floors are `F7-51`; which tool does which job is
`docs/engineering/03-tech-stack.md` §11, *Motion*. Motion lives in a `packages/ui` component: a
screen turns it on by a prop and never animates by hand, a move between screens is the
navigator's, and the studio's 3D scene animates in its own code under the same floors. Build it so:

- **Durations and easings come from `theme.motion`** (web: `var(--dur-*)`, `var(--ease-*)`) — never a
  typed `ms` or a bezier.
- **Animate only `transform` and `opacity`** (and a shader's uniforms). A width, height, top, left,
  margin or padding that animates lays the page out again on every frame. A colour may fade once,
  over one token's duration — on the phone on the JS driver, which alone can carry it — never in a
  loop.
- **On the phone all other motion runs on the UI thread** — `useNativeDriver: true`, or a Reanimated
  worklet. No `setState` per frame.
- **Reduced motion is read through one shared hook** in `packages/ui`, with a web and a phone half —
  never a new `AccessibilityInfo` or `matchMedia` call: it is `useReducedMotion`
  (`packages/ui/src/primitives/use-reduced-motion{,.native}.ts`). A one-shot CSS motion needs no
  hook: its duration tokens fall to `1ms` on their own. A CSS loop does — at `1ms` it spins a thousand times a
  second — unless the design system's `keyframes.css` gives it a reduced keyframe, as `hg-spin` has.
  With it on, the end state shows at once.
- **A loop stops** when its state ends, when its view leaves the screen and when the app or tab goes
  to the background (web: `IntersectionObserver`, `visibilitychange`; phone: screen blur, `AppState`).
  A loop that never stops also keeps Android from going idle, and every Android view-tree read then fails.
- **Nothing waits on an animation.** Content renders at once; motion runs over what is already there.
  No `onAnimationEnd` gates a control or the data, and the rows of a list never arrive one by one.
- **Heavy motion loads late.** A shader or a motion library loads lazily (`import()` /
  `next/dynamic`), never in a screen's first-load bundle; one live shader canvas per screen at most,
  with its still frame as the fallback when the GPU path is missing.

## Screens

Hindi and Marathi words are written once, in the catalog, when a screen's words are built. A word
another screen already shows is reused as it stands. A newly drafted line is listed in the task for
a native review. A frame drawn in another language is never a word source: it is a second copy.

Every word a screen shows comes from `@heliogrid/i18n`, as `packages/i18n/CLAUDE.md` says. No check
finds a bare English literal in JSX.

## Presentation and logic live in different files

**Style never lives in a web component file** — it is `<Name>.css`; a phone screen's layout is its
`styles.ts` (`apps/mobile/CLAUDE.md`), and a `packages/ui` native half keeps its `StyleSheet` below
its markup. Three roles:
a **container** (`<Name>Screen.tsx`) composes and holds only visual state; a **presentational**
component takes props and returns markup, with no data access and no navigation; **logic** both
platforms need lives in a shared package — a `domain` view model filled by a `data` hook (Law 11)
— and an app's `use-<thing>.ts` is its platform adapter only (`apps/web/CLAUDE.md`,
`apps/mobile/CLAUDE.md`). A `.tsx` holding both a data-fetching effect chain and the markup it
feeds is a review finding.

## Done means

The per-screen Definition of Done, `F7-43` (`docs/prd/foundations/F7-design-language.md`) — for a
component: at 375 and 1536, in Hindi, both halves on the one `<Name>.types.ts`.
