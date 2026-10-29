import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { SurfaceRead, SurfaceState } from '../UnavailableNote';

/** Everything a card takes but the read it shows. */
export interface CardFrameProps {
  children?: ReactNode;
  /** expressive = the tile's `--r-tile` and `--tile-pad`; functional = 12px / 16px */
  density?: 'expressive' | 'functional';
  /** enables the hover fill + pointer */
  interactive?: boolean;
  /** the inset 1.5px accent ring a focused field also draws; on `raised`, an outer 2px ring */
  selected?: boolean;
  /**
   * `tile` (default): the grey `--fill` tile (`F7-49`). `raised`: a white `--surface` card on
   * `--e1`, `--r-lg` — a list of records set on the page (`SCR-M01-20`'s payment terms). It is a
   * page ground, not a tile, so a control inside it takes the page's fill.
   */
  surface?: 'tile' | 'raised';
  /**
   * **Names the card as one control** — from `packages/i18n`. With `onClick` it is the card's
   * accessible name and `selected` reads as current. Opt-in, so a card that holds its own buttons
   * is never a button around buttons. It may be the record's own name (a template's).
   */
  // biome-ignore lint/plugin/copy-prop-type: the card's name may be the record's own name, a fact
  label?: string;
  /** Each state's words are drawn only when given — `@heliogrid/i18n`'s `CARD` holds the usual ones. */
  emptyTitle?: TranslatedText;
  /** The empty sentence. */
  emptyMessage?: TranslatedText;
  emptyAction?: ReactNode;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  /**
   * Makes the card the target. The DS declares `(e: React.MouseEvent) => void`; the shared
   * contract carries no DOM event, so the platform halves call it with nothing.
   */
  onClick?: () => void;
}

/**
 * **The card has states**, because law 1 ("states are part of done") applies to the surface every
 * screen reaches for first. The card's frame, padding and radius never move between states — only
 * the body changes. `unavailable` renders through `UnavailableNote`: neutral, and no retry.
 *
 * `read` is the read this frame shows. Pass none when it holds static content: it draws `ready`.
 * `failed` draws the error with its retry; `unavailable` draws none. A card that shows a read
 * names what it is loading — `loadingLabel`, spoken while the read is out.
 */
export type CardRead =
  | { read?: undefined; loadingLabel?: undefined; focusAfter?: undefined }
  | {
      read: SurfaceRead;
      loadingLabel: TranslatedText;
      /** Where focus lands once *Try again* has gone: the card's own frame unless the caller names a part that stays. */
      focusAfter?: FocusAfter;
    };

export type CardProps = CardFrameProps & CardRead;

/** The body both halves draw inside the frame — the one part that moves between states. */
export type CardBodyProps = {
  state: SurfaceState;
  onRetry?: () => void;
  loadingLabel?: TranslatedText;
  /** The card's frame, where focus lands once its retry has left. */
  focusAfter: FocusAfter;
} & Pick<
  CardFrameProps,
  | 'children'
  | 'emptyTitle'
  | 'emptyMessage'
  | 'emptyAction'
  | 'errorTitle'
  | 'errorMessage'
  | 'retryLabel'
  | 'unavailableTitle'
  | 'unavailableMessage'
>;

export interface IconCircleProps {
  children?: ReactNode;
  /** semantic or brand colour; the circle fills a 6% tint of it over the ground that holds it */
  color?: string;
  size?: number;
}
