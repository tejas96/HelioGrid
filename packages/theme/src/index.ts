/**
 * Public entry — re-exports the generated theme so `@heliogrid/theme` is importable as a
 * package. The theme is BUILT (dist/theme.ts, from src/_generated via build.ts); run
 * `pnpm --filter @heliogrid/theme build` first — turbo's typecheck task depends on build.
 */
export { type Theme, theme } from '../dist/theme';
