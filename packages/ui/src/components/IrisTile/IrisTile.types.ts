import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { IrisHue } from '../Avatar/Avatar.types';

/** The tile's side, px/dp: a card head 32, a table row 34, a list line 36, an accelerator 40. */
export type IrisTileSize = 32 | 34 | 36 | 40;

/**
 * **A glyph on its iris** (`D271`, `D268`): one of the system's glyphs, by name, on the wash of an
 * iris hue with its ink, through the shared iris rule (`Avatar`'s `hg-iris`, `irisTintOf`), so every
 * kind tile and card head tints one way. Decorative: the words beside it say what it is.
 */
export interface IrisTileProps {
  glyph: ShellGlyphName;
  iris: IrisHue;
  size: IrisTileSize;
  /** The glyph's stroke as its board draws it. */
  stroke: number;
}
