import type { StandingDestination } from '@heliogrid/domain';
import type { ShellGlyphName, ShellGlyphSize } from './AppShell.types';

/** Each size in px/dp — OneOhm's web steps (`size-3` … `size-8`), one table for both halves. */
export const GLYPH_SIZE: Record<ShellGlyphSize, number> = {
  xs: 12,
  dense: 14,
  sm: 16,
  nav: 18,
  md: 20,
  lg: 24,
  xl: 32,
};

/** Lucide's own stroke, on its 24 box, at every size: one weight across the product. */
export const GLYPH_STROKE = 2;

/** Which shape stands for which standing destination — the export's choice, drawn by both shells. */
export const DESTINATION_GLYPH: Record<StandingDestination, ShellGlyphName> = {
  home: 'house',
  leads: 'people',
  proposals: 'document',
  projects: 'board',
  people: 'pair',
  campaigns: 'megaphone',
  more: 'dots',
};

/**
 * The step nearest a size in px — for a part whose glyph follows its own type size; a tie goes down.
 * `nav` is the sidebar's own step, never a type size's.
 */
export function nearestGlyphSize(px: number): ShellGlyphSize {
  const steps = (Object.entries(GLYPH_SIZE) as [ShellGlyphSize, number][]).filter(
    ([step]) => step !== 'nav',
  );
  return steps.reduce((best, step) =>
    Math.abs(step[1] - px) < Math.abs(best[1] - px) ? step : best,
  )[0];
}
