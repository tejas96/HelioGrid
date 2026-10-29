import type { ShellGlyphName } from '../AppShell/AppShell.types';

/** The glyph an unknown kind falls back to, so a stream never renders an empty box. */
export const FALLBACK_GLYPH: ShellGlyphName = 'dot';

/**
 * Which glyph each activity kind draws. The shapes live in `SHELL_GLYPHS`, so both halves draw
 * the same outline.
 *
 * `agent` is absent on purpose: brand and AI affordances are a gradient-filled object rather than
 * an outlined icon (`F7-06`), and each half draws that object with its own platform's gradient.
 */
export const ACTIVITY_GLYPH: Record<string, ShellGlyphName> = {
  note: 'note',
  phone: 'phone',
  flag: 'flag',
  user: 'user',
  doc: 'file',
  link: 'link',
  clipboard: 'clipboard',
  grid: 'grid',
  check: 'tick',
  rupee: 'rupee',
  cog: 'cog',
  bell: 'bell-short',
  undo: 'undo-loop',
  dot: 'dot',
  /* The notification centre's marks (`SCR-SHELL-03`). */
  eye: 'eye',
  'calendar-check': 'calendar-check',
  clock: 'clock-small',
  /* The centre's filter bar and its Mark all read (`SCR-SHELL-03`). */
  'bar-chart': 'bar-chart',
  users: 'people',
  bill: 'document',
  'check-check': 'check-check',
  'user-plus': 'user-plus',
};

/** The outline a kind draws: its own, else the fallback. */
export function activityGlyphOf(name: string): ShellGlyphName {
  return ACTIVITY_GLYPH[name] ?? FALLBACK_GLYPH;
}

/** The brand object sits a step inside the glyph's box, so it reads as the same size as an outline. */
export function agentObjectSize(size: number): number {
  return size - 2;
}
