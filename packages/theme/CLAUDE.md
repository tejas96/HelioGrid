# @heliogrid/theme — every visual value, typed once

The no-raw-values law is `.claude/rules/ui-adherence.md`, which loads with this folder; the look
it serves is `CLAUDE.md` §10.

- **`src/tokens/` is the one source.** Colours (`colors.ts`: light, dark, and field mode as a light
  variant), type, spacing, radius, elevation and motion are typed TypeScript. A colour name is
  declared once in `COLOR_TOKENS`, and each palette is a `Record` over it, so a palette missing one
  does not compile.
- **A new colour pair is declared in `src/contrast.ts`** with its floor; `tests/contrast.test.ts`
  measures every pair in light, dark and field mode.
- NEVER component code (that is `@heliogrid/ui`) or anything product-specific.
- Consumers read `dist/`: after editing `src/`, run `pnpm --filter @heliogrid/theme build`.

## What the build emits

`dist/tokens.css` (the faces, every token in light, dark and field, reduced motion, the
keyframes), `dist/base.css` and `dist/print.css` (from `src/css/`), the phone's `theme` object and
the tokens as code (`dist/index.js`), `dist/android-res/` (the palette as Android `values` and
`values-night`, which the phone's `build.gradle` adds as a resource folder) and `dist/fonts/`.

## Traps

- A colour on the phone is a system colour (iOS dynamic, Android resource), not a hex: arithmetic
  on one fails at run time → a style reads `colors` from `packages/ui`'s `Color` primitive, and
  arithmetic reads `theme.palettes` (`usePalette` for the scheme on screen).
- The iOS launch screen cannot read the theme → its `SplashCanvas` colour set is held equal to
  `--canvas` by `tests/platform-colours.test.ts`.
- A web font file in `assets/fonts` that is not named in `BUNDLED_FACES` is never shipped, and a
  family whose file reads another name fails the build.
