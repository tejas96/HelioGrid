# ADR-0026: UI styling — plain CSS on web, StyleSheet on native, and Tailwind for layout

Date: 2026-09-04 · Records a reversal of `docs/engineering/17-ui-architecture-v2.md` §3 that had
already happened in the code without a decision record.

## Context

Doc 17 §3 prescribed three things for the UI layer:

1. **`react-native-unistyles` v3** for React Native, for its `variants`/`compoundVariants` mapping
   onto the design system's prop enums, and for theme swap without re-render.
2. **Radix** underneath the web components, for focus management and roving tabindex.
3. **No Tailwind**, on the grounds that a token-shaped system fights a utility-shaped one.

That section also said, of the unistyles choice: *"If the new session judges the dependency not
worth it, plain `StyleSheet` plus a small `useStyles` helper is a legitimate fallback — but make
that call explicitly and write down why, do not drift into it."*

The layer was then built. None of the three prescriptions held:

| prescribed | built |
|---|---|
| `react-native-unistyles` v3 | `StyleSheet.create`, inside each `.native.tsx` |
| Radix underneath the web half | no Radix; the primitives own focus and roles directly |
| no Tailwind | Tailwind imported in `apps/web/app/globals.css` |

Neither `react-native-unistyles` nor `radix` appears in `pnpm-lock.yaml`. No record was written.
The drift the section warned against is exactly what happened, which is why this ADR exists.

## Decision

**Confirm the built state as the decision, and correct doc 17 §3 to match.**

- **Web components: plain CSS files plus CSS custom properties.** The design system's own source
  is custom properties, so the repo mirrors it with no translation layer, no runtime cost and no
  build plugin. This half of §3 was followed and is unchanged.
- **Web layout: Tailwind, for layout utilities only** — `flex`, `grid`, `min-h-dvh` and the like.
  Every visual value still comes from `@heliogrid/theme` through `var()`. §3's objection was to a
  utility system carrying VALUES, and that objection stands: a Tailwind colour, spacing or type
  class in this repo is the same defect as a raw hex.
- **Native components: `StyleSheet`.** The dependency unistyles would add is not repaid while the
  density-mode switch it was chosen for has no product surface. Its other benefit — collapsing
  variant wiring — is real but smaller than a Babel plugin and a runtime on the critical path.
- **No Radix.** `Pressable` owns the 44px target, the focus ring and `accessibilityRole`, and it
  owns them on BOTH platforms. Putting Radix under the web half alone would split that ownership
  across two mechanisms and leave the native half unserved.

## Consequences

- **"Style out of the component file" is now true on web and false on native**, because a native
  half holds its `StyleSheet.create` inline. That is the cost of this decision, it is recorded as
  `M42` in `docs/engineering/mechanisms.md` with status NONE, and closing it means a
  `<Name>.styles.ts` per component plus a filename rule. Until then the rule is web-only in
  practice and must not be stated as though it holds everywhere.
- **Density mode has no mechanism.** If the product ships the Expressive/Functional switch, this
  decision is revisited rather than worked around per component.
- **Variant wiring is hand-written on native** — a `Record<Variant, VariantVisual>` per component.
  A fifth variant is two independent edits, and only the prop NAME is compared across halves
  (`M35`). The shared `<Name>.types.ts` is what keeps that honest.
- Doc 17 §3 is corrected to describe this, not the unistyles plan.
