export interface CheckboxProps {
  checked?: boolean;
  /**
   * The DS declares this as a DOM change event; the shared contract hands back the value instead,
   * so both platforms call it the same way.
   */
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  /**
   * The accessible name where there is **no visible `label`** — a `DataTable`'s selection tick,
   * whose visible name is the record in the row beside it. Ignored when `label` is set, so the two
   * cannot disagree.
   */
  ariaLabel?: string;
}
