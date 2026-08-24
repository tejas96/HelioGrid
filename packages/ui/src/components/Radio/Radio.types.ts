/**
 * 20px radio. Checked = 2px accent ring + accent dot.
 *
 * The visible box is 20px and the TARGET is 44 — the hit box is the whole row, the same
 * two-rectangles treatment Checkbox and FilterBar use (Pressable's law, docs/engineering/17 §4).
 */
export interface RadioProps {
  checked?: boolean;
  /**
   * Fires when the option is picked.
   *
   * The design system declares this as `(e: React.ChangeEvent<HTMLInputElement>) => void`;
   * a DOM event cannot cross to React Native, so the shared contract is the neutral form.
   * Every call site in the DS ignores the event (`onChange={() => setM('rooftop')}`).
   */
  onChange?: () => void;
  label?: string;
  /** Group members share one `name` — that is what makes them one radio group. */
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
}
