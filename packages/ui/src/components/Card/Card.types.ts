import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ThemeColor } from '../../primitives/Color/colors';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { SurfaceRead } from '../UnavailableNote';

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
   * Which tile a `tile` card is (`Ground`): `solid` (default) a data or list card — the card colour, a
   * hairline, no shadow; `glass` a summary card — a figure or a block a home is about (the owner's
   * dashboard). Ignored on `raised`.
   */
  tile?: 'solid' | 'glass';
  /**
   * The element the web draws the frame as: `section` for a card that is a titled part of a page
   * (the customer's page). The phone draws a `View` either way.
   */
  as?: 'div' | 'section';
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

/**
 * A card's head — OneOhm's card header: its title in the sans face (16/24, semibold), a quiet line
 * under it, the card's one act at the end. The one head a card with a named job draws; a card never
 * hand-rolls its own.
 */
export interface CardHeaderProps {
  title: TranslatedText;
  /** The quiet line under the title; none draws nothing. */
  description?: TranslatedText | null;
  /** The card's one act, at the head's end; none draws nothing. */
  action?: ReactNode;
  /** A mark before the words — an icon in its circle, a done tick; none draws nothing. */
  lead?: ReactNode;
  /** The heading's level: 2 for a card on the page (the default), 3 inside a titled section. */
  level?: 2 | 3;
  /**
   * The title's face: `sans` (default) OneOhm's card head; `display` the serif card title a page
   * read by a customer gives each card (`card-title`, Newsreader).
   */
  face?: 'sans' | 'display';
}

export interface IconCircleProps {
  children?: ReactNode;
  /** semantic or brand colour; the circle fills a soft tint of it over the ground that holds it */
  color?: ThemeColor;
  size?: number;
}
