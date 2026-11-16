import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { EmptySceneName } from '../EmptyScene/EmptyScene.types';
import type { SurfaceState } from '../UnavailableNote';

/**
 * **The one body a frame draws for a read's five states** — a card, a block and every frame that
 * holds its state in a line of words above its content. The frame's padding and radius never move
 * between states; only this body does. `loading` is `LoadingBars`' text lines, `error` a warning
 * sentence with its retry, `unavailable` `UnavailableNote` (neutral, never a retry), `empty` a quiet
 * sentence and its first act. Each state's words are drawn only when given.
 */
export interface StateBodyProps {
  state: SurfaceState;
  children?: ReactNode;
  /** Spoken while the read is out. */
  loadingLabel?: TranslatedText;
  emptyTitle?: TranslatedText;
  emptyMessage?: TranslatedText;
  emptyAction?: ReactNode;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  onRetry?: () => void;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /** The frame, where focus lands once its retry has left. */
  focusAfter: FocusAfter;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
}

/** The one quiet sentence an inline body's empty and error forms draw: a bold lead, then the rest. */
export interface StateMessageProps {
  tone?: 'warning';
  title?: TranslatedText;
  message?: TranslatedText;
  action?: ReactNode;
}

/**
 * The centred form of a blocked surface that has room — a map, a comparison, a sheet: a mark in a
 * tinted disc, a title, a sentence and one act. `warning` is the error form and its act the retry;
 * the neutral form is `empty`. `unavailable` is `UnavailableNote`'s `region`, never this.
 */
export interface StateRegionProps {
  tone?: 'warning';
  /** The neutral form's mark — what the surface would have shown. The warning form draws the alert. */
  glyph: ShellGlyphName;
  /** A calm line drawing in place of the mark (`EmptyScene`): a place with nothing in it yet. */
  scene?: EmptySceneName;
  title?: ReactNode;
  message?: ReactNode;
  /** The retry on the warning form, or the first act on the neutral one — or both. */
  action?: ReactNode;
}
