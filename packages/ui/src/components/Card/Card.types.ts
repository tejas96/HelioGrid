import type { ReactNode } from 'react';
import type { SurfaceState } from '../UnavailableNote';

export interface CardProps {
  children?: ReactNode;
  /** expressive = 24px radius / 24px pad; functional = 12px / 16px */
  density?: 'expressive' | 'functional';
  /** enables hover lift + pointer */
  interactive?: boolean;
  /** 2px accent focus ring */
  selected?: boolean;
  /**
   * **The card has states**, because law 1 ("states are part of done") applies to the surface every
   * screen reaches for first. The card's frame, padding and radius never move between states — only
   * the body changes. `unavailable` renders through `UnavailableNote`: neutral, and no retry.
   */
  state?: SurfaceState;
  emptyTitle?: string;
  /** The empty sentence. Default "Nothing here yet." */
  emptyMessage?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  /** Draws the retry. `error` is the only state that ever offers one. */
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
  /**
   * Makes the card the target. The DS declares `(e: React.MouseEvent) => void`; the shared
   * contract carries no DOM event, so the platform halves call it with nothing.
   */
  onClick?: () => void;
}

export interface IconCircleProps {
  children?: ReactNode;
  /** semantic or brand colour; container fills a 6% tint of it */
  color?: string;
  size?: number;
}
