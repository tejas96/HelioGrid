/**
 * What an `Icon` hands its glyph. Nobody else passes these: the web `Icon` sizes the glyph by CSS,
 * and the native `Icon` clones its size and colour into it, since React Native has no currentColor.
 */
export interface AttentionGlyphProps {
  width?: number;
  height?: number;
  color?: string;
}
