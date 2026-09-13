/**
 * The entry a SOURCE reader follows. The package's own entry is `dist/index.ts`, which build.ts
 * writes beside `dist/theme.ts` and `package.json` points at — so this file is not what a
 * consumer imports; it exists so that opening `src/` leads somewhere rather than nowhere.
 * Run `pnpm --filter @heliogrid/theme build` first: turbo's typecheck depends on it.
 */
export { type Theme, theme } from '../dist/theme';
