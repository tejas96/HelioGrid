import type { StandingDestination } from '@heliogrid/domain';
import type { ShellGlyphName, ShellGlyphSize } from './AppShell.types';
import { type GlyphMark, SHELL_GLYPHS, SHELL_GLYPHS_FILLED } from './ShellGlyph.shapes';

/** A stable React key for a mark: no glyph draws the same mark twice. */
export function markKey(mark: GlyphMark): string {
  if (mark.kind === 'path') return mark.d;
  if (mark.kind === 'circle') return `c${mark.cx}-${mark.cy}-${mark.r}`;
  return `r${mark.x}-${mark.y}-${mark.width}-${mark.height}`;
}

/** The stroke each size is drawn at: a 16 glyph at the system's 1.5 reads faint beside its words. */
const GLYPH_STROKE: Record<ShellGlyphSize, number> = { sm: 1.8, md: 1.5, lg: 1.5, xl: 1.5 };

export function glyphStroke(size: ShellGlyphSize): number {
  return GLYPH_STROKE[size];
}

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

/** One glyph's marks, for a component that draws its own box (`ShellGlyphMarks`). */
export interface ShellGlyphMarksProps {
  name: ShellGlyphName;
  /** The filled form, where the glyph has one; outlined otherwise. */
  filled?: boolean;
}
