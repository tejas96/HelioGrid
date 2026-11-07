/**
 * True once the body has scrolled more than 2px under the head, which then draws its shadow — the
 * one threshold every overlay in the family reads.
 */
export function isBodyScrolled(offset: number): boolean {
  return offset > 2;
}

/**
 * Where a sheet's header goes, from its title, overline and subtitle (`heading`, in that order):
 * `drawn` when it has any of them or a close; `closeOnly` when it would hold the close alone under
 * a grab handle — the close then rides the handle's row, at its end, since a sheet whose content
 * opens on its own title (an item's name) lost a 44-point row to a lone ✕; `row` when it takes a
 * row of its own.
 */
export function sheetHeaderOf(
  handle: boolean,
  showClose: boolean,
  heading: readonly [unknown, unknown, unknown],
): { drawn: boolean; closeOnly: boolean; row: boolean } {
  const [title, overline] = heading;
  const drawn = title !== undefined || overline !== undefined || showClose;
  const closeOnly = handle && showClose && heading.every((part) => part === undefined);
  return { drawn, closeOnly, row: drawn && !closeOnly };
}
