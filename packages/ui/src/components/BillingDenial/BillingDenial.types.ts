import type { TranslatedText } from '@heliogrid/contracts';
import type { BillingStripGo, BillingStripRow } from '../BillingStrip/BillingStrip.types';

/**
 * `SCR-SHELL-06`'s denial: what a refused save was, what paused and what still works — the strip's
 * own two lists (decision 10) — and ONE act, or whose act it is. A sheet at 375 and a centred modal
 * at 1536 (`EditorSurface desktop="modal"`). The blocked control is never disabled beforehand.
 */
export interface BillingDenialView {
  readonly overline: TranslatedText;
  readonly title: TranslatedText;
  readonly rows: readonly BillingStripRow[];
  /** The act's words with its figures as `FIGURE_SLOT`s, drawn in mono (`F7-09`). */
  readonly act: {
    readonly label: TranslatedText;
    readonly figures: readonly string[];
    /** The words with the figures in place, as a screen reader hears them. */
    readonly spoken: TranslatedText;
    readonly go: BillingStripGo;
  } | null;
  /** Whose act it is, for a person who is not the Owner (`M12-56`). */
  readonly scope: TranslatedText | null;
}

export interface BillingDenialWords {
  /** The lists' name for a screen reader. */
  readonly lists: TranslatedText;
  readonly closeLabel: TranslatedText;
}

export interface BillingDenialProps {
  /** The refusal being shown; `null` keeps the denial closed. */
  denial: BillingDenialView | null;
  words: BillingDenialWords;
  onAct: () => void;
  /** Closing returns focus to the control that was refused (the overlay's own return). */
  onClose: () => void;
  /** The act is out: the button is busy and a second press sends nothing. */
  acting?: boolean;
  /** Why the act did not land, said under the button. */
  failure?: TranslatedText | null;
}
