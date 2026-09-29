import type { InputProps } from './Input.types';

/** The one line under a field, and what it is. */
export interface InputNote {
  kind: 'error' | 'success' | 'helper';
  text: string;
}

/**
 * The line under the field: the error, else the success words, else the helper — the first that has
 * words. An empty or blank one is absent, so no ring or mark is ever drawn without its words
 * (`F7-12`). Both halves draw what this returns, and the error ring shows only for an error line.
 */
export function inputNote({
  error,
  success,
  helper,
}: Pick<InputProps, 'error' | 'success' | 'helper'>): InputNote | null {
  if (hasWords(error)) return { kind: 'error', text: error };
  if (hasWords(success)) return { kind: 'success', text: success };
  if (hasWords(helper)) return { kind: 'helper', text: helper };
  return null;
}

function hasWords(text: string | undefined): text is string {
  return text !== undefined && text.trim() !== '';
}
