import type { ReactNode } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Near-black label for a control whose meaning isn't obvious. Opens on hover AND keyboard focus,
 * closes on Escape. Never the only place a piece of information exists — touch users will not
 * see it.
 *
 * **And the replacement exists.** The long-form explanation of a number — a formula in words, an
 * assumption, a model boundary, an exclusion — is `Derivation` (law 24), which `MS10-19` requires
 * to be *"readable on touch and by screen readers, not tooltip-only"*. A short trust label beside
 * a figure is `Provenance`. Neither is ever this.
 */
export interface TooltipProps {
  label: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  /** Hover delay in ms. Focus opens immediately after the same delay. */
  delay?: number;
}
