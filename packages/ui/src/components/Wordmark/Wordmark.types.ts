/**
 * The wordmark's three tones. `default` = near-black with iridescent "Grid" · `onDark` =
 * white + iridescent · `mono` = flat, for print and one-colour contexts.
 */
export type WordmarkTone = 'default' | 'onDark' | 'mono';

export interface WordmarkProps {
  /** Rendered type size in px/dp. Default 22. */
  size?: number;
  /** default = near-black with iridescent "Grid" · onDark = white + iridescent · mono = flat. */
  tone?: WordmarkTone;
}

export interface LogoTileProps {
  /** Tile edge in px/dp. Default 40. */
  size?: number;
  /** Corner radius. Absent, the mark is a disc. */
  radius?: number;
}

/** The mark and the name side by side: the sidebar's brand, a door's head. */
export interface ProductMarkProps {
  /** The mark's side and the name's size follow from this, px/dp. Default 32. */
  size?: 32 | 40;
}
