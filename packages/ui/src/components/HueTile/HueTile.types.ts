import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { CategoryHue } from '../Avatar/Avatar.types';

/** The tile's side, px/dp: a card head 32, a table row 34, a list line 36, an accelerator 40. */
export type HueTileSize = 32 | 34 | 36 | 40;

/**
 * **A glyph on its hue**: one of the system's glyphs, by name, on the wash of a category hue with
 * its words' colour (`Avatar`'s `hg-hue`, `hueTintOf`), so every kind tile and card head tints one
 * way. Decorative: the words beside it say what it is.
 */
export interface HueTileProps {
  glyph: ShellGlyphName;
  hue: CategoryHue;
  size: HueTileSize;
  /** The glyph's stroke as its board draws it. */
  stroke: number;
}
