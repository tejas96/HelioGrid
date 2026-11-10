import type { ReactNode } from 'react';
import type { CategoryHue } from '../Avatar/Avatar.types';

/** The six chip/badge tones — each resolves to a semantic `-text` token (and a `-bg` for Badge). */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

/**
 * A Badge's tones: the six, and the three brand iris tones, which label a KIND (a role, a
 * category), never a state — a state is success / warning / danger / info (design-system change 7).
 */
export type BadgeTone = ChipTone | CategoryHue;

/** Expressive = the brand's 28px pill; functional = the dense 24px working set. */
export type ChipDensity = 'expressive' | 'functional';

export interface ChipProps {
  children?: ReactNode;
  /** filter chip active state — the accent wash, as every chosen filter is */
  active?: boolean;
  /**
   * How many records the chip's filter holds — drawn in a small mono slot after the words. A `0`
   * chip stays, quiet: hiding it would hide that the kind exists. Spoken with the words.
   */
  count?: number;
  /** With a handler the chip is a button inside a 44px target; without one it is a plain span. */
  onClick?: () => void;
  /** show a leading status dot */
  dot?: boolean;
  tone?: ChipTone;
  density?: ChipDensity;
}

export interface BadgeProps {
  children?: ReactNode;
  /** `violet` | `blue` | `magenta` are the brand iris tones for a KIND, never a state. */
  tone?: BadgeTone;
  density?: ChipDensity;
}
