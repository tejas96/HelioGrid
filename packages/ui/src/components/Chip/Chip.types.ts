import type { ReactNode } from 'react';

/** The six chip/badge tones — each resolves to a semantic `-text` token (and a `-bg` for Badge). */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

/** Expressive = the brand's 28px pill; functional = the dense 24px working set. */
export type ChipDensity = 'expressive' | 'functional';

export interface ChipProps {
  children?: ReactNode;
  /** filter chip active state — near-black fill, white text */
  active?: boolean;
  /** With a handler the chip is a button inside a 44px target; without one it is a plain span. */
  onClick?: () => void;
  /** show a leading status dot */
  dot?: boolean;
  tone?: ChipTone;
  density?: ChipDensity;
}

export interface BadgeProps {
  children?: ReactNode;
  tone?: ChipTone;
  density?: ChipDensity;
}
