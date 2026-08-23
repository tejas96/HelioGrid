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
  /** Corner radius. Follows the density, never a circle. Default 12. */
  radius?: number;
}
