import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * After Generate (`M06-20`, `T-M06-022`): one screen where the cover lands with the server's number
 * and the version, *See it and share* as the main act and *Download PDF* beside it. The landing
 * plays once; with reduced motion the cover is simply there.
 */
export interface ProposalReadyWords {
  /** `Generated`. */
  readonly status: TranslatedText;
  /** `Anil's proposal is ready`. */
  readonly title: TranslatedText;
  /**
   * `PRP-0042 · version 1 · ₹1,90,575 · 9 pages`, the number and the amount standing as
   * `FIGURE_SLOT`s where the words put them — the screen fills them with `lineFigures`, in order, in
   * the mono face (an identifier and money, §9 and §10).
   */
  readonly line: TranslatedText;
  /** The number and the amount, in the order the line's slots take them. */
  // biome-ignore lint/plugin/copy-prop-type: the server's number and amount, never words
  readonly lineFigures: readonly string[];
  readonly share: TranslatedText;
  readonly download: TranslatedText;
  /** `Back to Anil's lead`. */
  readonly back: TranslatedText;
  /** The moment, spoken. */
  readonly moment: TranslatedText;
}

export interface ProposalReadyProps {
  readonly wide: boolean;
  readonly words: ProposalReadyWords;
  /** The cover — a `ScaledProposalPage`; the screen tilts it and lands it. */
  readonly cover: ReactNode;
  readonly onShare: () => void;
  readonly onDownload: () => void;
  /** The PDF is being made: the act waits and says so. */
  readonly downloading?: boolean;
  readonly onBack: () => void;
  /** The device's safe areas, dp, from the app's own reader; a browser reads its own. */
  readonly safe?: { readonly top: number; readonly bottom: number };
}
