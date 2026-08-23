/** The six status tones — each resolves to a semantic token PAIR (`-text` on `-bg`). */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

/**
 * The non-colour channel (F7-12): each tone carries its own GLYPH, so two states never
 * differ by hue alone — not for colourblind users, not in sunlight, not in grayscale print.
 * One declaration for both platforms.
 */
export const STATUS_GLYPH: Record<StatusTone, string> = {
  neutral: '•',
  info: 'i',
  success: '✓',
  warning: '!',
  danger: '×',
  accent: '◆',
};

export interface StatusMarkProps {
  /** The MEANING — picks the token pair and the glyph. */
  tone: StatusTone;
  /** Required words. Status is never carried by colour alone (F7-12). */
  label: string;
  /**
   * Hide the glyph ONLY when a neighbouring mark already carries the state (e.g. a table
   * row whose dot sits in another cell). The words always stay.
   */
  mark?: boolean;
}
