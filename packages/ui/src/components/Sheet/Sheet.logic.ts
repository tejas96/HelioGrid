/**
 * True once the body has scrolled more than 2px under the head, which then draws its shadow — the
 * one threshold every overlay in the family reads.
 */
export function isBodyScrolled(offset: number): boolean {
  return offset > 2;
}
