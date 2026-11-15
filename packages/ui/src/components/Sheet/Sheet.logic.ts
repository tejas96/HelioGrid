/**
 * True once the body has scrolled more than 2px under the head, which then tucks its title and
 * fades the rows under it — the one threshold every overlay in the family reads.
 */
export function isBodyScrolled(offset: number): boolean {
  return offset > 2;
}

/**
 * Where a sheet's header goes, from its title, overline and subtitle (`heading`, in that order):
 * `drawn` when it has any of them or a close; `closeOnly` when it would hold the close alone under
 * a grab handle — the close then rides the handle's row, at its end, since a sheet whose content
 * opens on its own title (an item's name) lost a 44-point row to a lone ✕; `row` when it takes a
 * row of its own. The phone passes `showClose` false: its handle is the close.
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

interface TuckFacts {
  handle: boolean;
  hasTitle: boolean;
  headerLook: 'row' | 'moment';
  /** The meta row, if the sheet has one. */
  meta: unknown;
  bodyScrolls: boolean;
}

/**
 * Whether the header tucks its title into the handle's row once the body scrolls: only a titled
 * row header over a scrolling body, under a handle, with no meta row between them. A meta row
 * stays in view below the header, so a header lifted over the body would leave a gap above it.
 */
export function sheetTucks({
  handle,
  hasTitle,
  headerLook,
  meta,
  bodyScrolls,
}: TuckFacts): boolean {
  const hasMeta = meta !== undefined && meta !== null;
  return handle && hasTitle && headerLook === 'row' && !hasMeta && bodyScrolls;
}
