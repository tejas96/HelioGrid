/**
 * The entry a SOURCE reader follows. The package's own entry is `dist/index.ts`, which build.ts
 * writes and `package.json` points at. Run `pnpm --filter @heliogrid/theme build` first: turbo's
 * typecheck depends on it.
 */
export { type Theme, theme } from '../dist/theme';
export * from './tokens/index';
