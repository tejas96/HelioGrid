import type { TranslatedText } from '@heliogrid/contracts';
/**
 * **How a whole splits, and the filter onto each part** (`SCR-M01-17`'s overview): one entry per
 * part with its count and its hue. `rings` draws a row of share rings — each arc its part's share,
 * the count inside, the label under — and `bar` one stacked bar over a row of count buttons. Every
 * ring or button is a toggle that scopes the caller's list to its part; the one in force is tinted
 * and pressed, and none is when nothing is scoped. Every word is the caller's.
 */
export interface ShareFilterProps {
  layout: 'rings' | 'bar';
  /** The group's accessible name: *What the import will do*. */
  label: TranslatedText;
  /** `bar` only: the stacked bar's accessible sentence, every part and its count. */
  barLabel?: TranslatedText;
  items: readonly ShareFilterItem[];
  /** The part in force, or `null` when nothing is scoped. */
  pressed: string | null;
  /** The part pressed — the caller clears it when it was already in force. */
  onPress: (id: string) => void;
}

/** One part: its id, its words, its count and the hue it is drawn in. */
export interface ShareFilterItem {
  readonly id: string;
  readonly label: TranslatedText;
  /** The toggle's accessible name: *Price overrides, 318 rows*. */
  readonly accessibleLabel: TranslatedText;
  readonly count: number;
  /**
   * The part's hue: `blue` and `violet` the brand's two iris inks (`--iris-blue`, `--iris-violet`),
   * the rest the status inks — the warning one at the ink that holds 3:1.
   */
  readonly hue: 'blue' | 'violet' | 'warning' | 'success' | 'danger';
  /** A part that asks for the person (*Need you*): its label bold, in the warning ink. */
  readonly asks?: boolean;
}
