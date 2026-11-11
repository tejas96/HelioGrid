import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { CategoryHue } from '../Avatar/Avatar.types';

/**
 * The tile's side, px/dp: a group head 24, a card head 32, a table row 34, a list line 36, an
 * accelerator or a row 40, a tap target 44, a hero 48, a sheet's moment 56.
 */
export type HueTileSize = 24 | 32 | 34 | 36 | 40 | 44 | 48 | 56;

/** A state a tile carries — on its status wash and words pair, measured as every pair is. */
export type HueTileTone = 'danger' | 'warning' | 'success' | 'accent' | 'neutral';

/**
 * **A glyph on its tint**: one of the system's glyphs, by name, on the wash of a category hue
 * (`Avatar`'s `hg-hue`, `hueTintOf`) or of a status tone, with its words' colour — so every kind
 * tile, card head, waited-on party and step tile tints one way. Decorative: the words beside it
 * say what it is.
 */
export interface HueTileProps {
  glyph: ShellGlyphName;
  hue: CategoryHue | HueTileTone;
  size: HueTileSize;
  /** The glyph's stroke as its board draws it. */
  stroke: number;
}
