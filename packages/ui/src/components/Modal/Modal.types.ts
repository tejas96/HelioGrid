import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/** sm 400 · md 520 · lg 720 · wide the page's content width — a palette over the page (capped at 100%). */
export type ModalSize = 'sm' | 'md' | 'lg' | 'wide';

export type ModalDensity = 'expressive' | 'functional';

/** Draws the leading circular icon tint. neutral = no icon unless `icon` is given. */
export type ModalTone = 'neutral' | 'danger' | 'warning' | 'success';

export interface ModalProps extends OverlayCloseWords {
  open?: boolean;
  onClose?: () => void;
  // biome-ignore lint/plugin/copy-prop-type: a heading may be the record's own name, a fact
  title?: string;
  /** One or two sentences. For errors, state the problem and the fix. */
  description?: TranslatedText;
  overline?: TranslatedText;
  children?: ReactNode;
  /** sm 400 · md 520 · lg 720 · wide the page's content width (capped at 100%). */
  size?: ModalSize;
  /** `centre` (default) a decision; `top` a palette under the top of the page, in reach of the keys. */
  place?: 'centre' | 'top';
  /**
   * The dialog's name when it draws no title — a palette whose field says what it is. Web:
   * `aria-label`. The phone has no dialog to name (RN has no dialog role); its field is read.
   */
  label?: TranslatedText;
  density?: ModalDensity;
  /** Draws the leading circular icon tint. neutral = no icon unless `icon` is given. */
  tone?: ModalTone;
  icon?: ReactNode;
  footer?: ReactNode;
  showClose?: boolean;
  /** false for decisions that must be answered by an action. */
  dismissible?: boolean;
  inset?: boolean;
  zIndex?: number;
  /**
   * The id of a heading the CALLER rendered. The fixed icon header makes a caller drop `title`,
   * and a dialog with no name is a dialog a screen reader announces as nothing. Same slot as
   * `Sheet.labelId`.
   */
  labelId?: string;
}
