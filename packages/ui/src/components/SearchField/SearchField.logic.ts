import type { TranslatedText } from '@heliogrid/contracts';

/** The field's spoken name: its own `ariaLabel`, else the words in the empty pill. */
export function searchName(
  ariaLabel: TranslatedText | undefined,
  placeholder: TranslatedText,
): TranslatedText {
  return ariaLabel ?? placeholder;
}

/** The clear act, with its spoken name. */
export interface ClearAct {
  clear: () => void;
  label: TranslatedText;
}

/** The clear act appears once there is a value, and only with its act and its spoken name. */
export function clearActOf(
  value: string | undefined,
  onClear: (() => void) | undefined,
  clearLabel: TranslatedText | undefined,
): ClearAct | null {
  return value !== undefined && value !== '' && onClear !== undefined && clearLabel !== undefined
    ? { clear: onClear, label: clearLabel }
    : null;
}
