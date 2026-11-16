import { colors, type ThemeColor } from '../Color/colors';

import type { Tone } from './tone.types';

export type { Tone };

/** A tone's three colours: the words' ink, the tint under them, and the mark (a dot, a glyph). */
export interface ToneColors {
  readonly ink: ThemeColor;
  readonly tint: ThemeColor;
  readonly mark: ThemeColor;
}

/**
 * Tone on the phone — the one place a tone becomes its tint, its ink and its mark, as `Tone.css` is
 * on the web. A native half reads a tone here and writes no map of its own. The ink is the tone's
 * -text partner, the only semantic colour allowed to set words; warning's mark is its -text too,
 * because plain `--warning` clears no contrast floor.
 */
export const TONE: Readonly<Record<Tone, ToneColors>> = {
  neutral: { ink: colors['neutral-text'], tint: colors['neutral-bg'], mark: colors.neutral },
  info: { ink: colors['info-text'], tint: colors['info-bg'], mark: colors.info },
  success: { ink: colors['success-text'], tint: colors['success-bg'], mark: colors.success },
  warning: {
    ink: colors['warning-text'],
    tint: colors['warning-bg'],
    mark: colors['warning-text'],
  },
  danger: { ink: colors['danger-text'], tint: colors['danger-bg'], mark: colors.danger },
  accent: { ink: colors.accent, tint: colors['accent-subtle'], mark: colors.accent },
};
