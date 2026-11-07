import type { TextColor, TextVariant } from '../../primitives/Text/Text.types';

/**
 * A figure that rolls up into place once, the first time it is shown: each digit is a column of
 * 0–9 that slides to its digit, moved by transform only (`.claude/rules/ui-adherence.md`, *Motion*),
 * so nothing is set per frame. Grouping, currency and the face are the caller's: it formats the
 * figure with the product's formatters (lakh and crore, the tenant's currency) and names the type
 * role the figure is set in — a hero in Newsreader, a list figure in `mono`. Only ASCII digits
 * roll; every other mark (₹, commas, %, a unit) stands still. Under reduced motion the figure is
 * simply there, and a screen reader hears the settled figure once.
 */
export interface RollingNumberProps {
  /** The settled figure, formatted by the caller: `₹18,40,000`, `32`, `74%`. */
  readonly value: string;
  /** The type role the figure is set in. Default `body`. */
  readonly variant?: TextVariant;
  readonly color?: TextColor;
  readonly bold?: boolean;
}
