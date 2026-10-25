/** Stands where the date goes, so the words before it come from the one whole message. */
const DATE_SLOT = '\u0000';

/**
 * The words of a settings page's *Saved and in force* line that come before its date, from the
 * catalog's one whole message. The date must come after the name: a message that starts with its
 * date gives `''`, which every page holds, so the caller's check would prove nothing.
 */
export function wordsBeforeDate(line: (date: () => string) => string | null): string {
  const [before = ''] = (line(() => DATE_SLOT) ?? '').split(DATE_SLOT);
  if (before === '') throw new Error('the saved line starts with its date: nothing to check');
  return before;
}
