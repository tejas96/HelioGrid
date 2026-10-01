import type { ShellGlyphName } from './AppShell.types';

/** One mark of a glyph, on a 24-unit square: a path, or a circle. */
export type GlyphMark =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number };

const path = (d: string): GlyphMark => ({ kind: 'path', d });
const circle = (cx: number, cy: number, r: number): GlyphMark => ({ kind: 'circle', cx, cy, r });

/**
 * The shell's own glyphs (`SCR-SHELL-01`), one drawing for both halves: outlined at the system's
 * one stroke, and a filled form only where the pill's item in view takes one (`F7-19`). Named for
 * the shape, never the product word it stands for — the app picks which shape means what.
 */
export const SHELL_GLYPHS: Record<ShellGlyphName, readonly GlyphMark[]> = {
  house: [path('M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z')],
  people: [
    path('M9 4.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4'),
    path('M2.5 20a6.5 6.5 0 0 1 13 0'),
    path('M16.6 5.6a3.2 3.2 0 0 1 0 4.9'),
    path('M18 20a6.4 6.4 0 0 0-2-4.6'),
  ],
  document: [
    path('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'),
    path('M14 3v5h5'),
    path('M9 13.5h5'),
    path('M9 17h3.5'),
  ],
  board: [path('M4 4.5h16v15H4z'), path('M9.3 4.5v15'), path('M14.7 4.5v15')],
  pair: [
    circle(9, 8, 3.2),
    path('M3 20a6 6 0 0 1 12 0'),
    circle(17, 9, 2.4),
    path('M15.5 14.2A5 5 0 0 1 21 19'),
  ],
  megaphone: [
    path('M4 10v4h3l6 4V6L7 10z'),
    path('M16.5 9.5a4 4 0 0 1 0 5'),
    path('M19 7a7.5 7.5 0 0 1 0 10'),
  ],
  dots: [circle(5, 12, 1.7), circle(12, 12, 1.7), circle(19, 12, 1.7)],
  'plus-circle': [circle(12, 12, 9), path('M12 8v8M8 12h8')],
  chevron: [path('m6 9 6 6 6-6')],
  shield: [
    path('M12 3.2 18.5 5.8v5.4c0 4.2-2.7 7.2-6.5 8.6-3.8-1.4-6.5-4.4-6.5-8.6V5.8z'),
    path('m9.4 12 1.9 1.9 3.4-3.5'),
  ],
  'sign-out': [
    path('M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3'),
    path('m10 8-4 4 4 4'),
    path('M6 12h9'),
  ],
  lock: [
    path(
      'M7 10.5h10a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18v-5A2.5 2.5 0 0 1 7 10.5z',
    ),
    path('M8 10.5V8a4 4 0 0 1 8 0v2.5'),
  ],
};

/** The filled forms; a glyph with none stays outlined in view. */
export const SHELL_GLYPHS_FILLED: Partial<Record<ShellGlyphName, readonly GlyphMark[]>> = {
  house: [path('M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z')],
  people: [circle(12, 8, 3.7), path('M5 20.5a7 7 0 0 1 14 0z')],
  document: [path('M13.6 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4z')],
  dots: [circle(5, 12, 1.7), circle(12, 12, 1.7), circle(19, 12, 1.7)],
};

/** The marks to draw, and whether they are filled. */
export function glyphMarks(
  name: ShellGlyphName,
  filled: boolean,
): { marks: readonly GlyphMark[]; solid: boolean } {
  const solid = filled ? SHELL_GLYPHS_FILLED[name] : undefined;
  return solid === undefined
    ? { marks: SHELL_GLYPHS[name], solid: false }
    : { marks: solid, solid: true };
}
