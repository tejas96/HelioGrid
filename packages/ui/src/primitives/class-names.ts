/** Web halves only: joins the primitive's base class with caller-supplied classes. */
export function classNames(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter((part): part is string => part !== undefined && part !== '').join(' ');
}
