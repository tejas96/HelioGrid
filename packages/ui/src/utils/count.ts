/**
 * A count on a control, clamped only when the control asks.
 *
 * `"99+"` is a NAVIGATIONAL shorthand: honest on a destination, where the reader only needs to know
 * there are more than they will read, and a LIE on a total the caller is reporting — a panel of 342
 * records that says `99+` has stated a number nobody can act on. So the clamp is per-component and
 * never implicit. `Block.blockCount` holds the same rule for a figure that also groups.
 */
export function clampCount(
  count: number,
  countMax?: number,
  /** How the UNCLAMPED number renders — a total that groups passes its grouper here. */
  format: (n: number) => string = String,
): string {
  return countMax !== undefined && count > countMax ? `${countMax}+` : format(count);
}
