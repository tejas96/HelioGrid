import type { TranslatedText } from '@heliogrid/contracts';

/**
 * Why a sheet's send sleeps (`F7-23`): the first field it still needs, said with its label, or
 * `null` once nothing is missing. Each entry is whether the field is missing, and its label.
 */
export function firstMissing(
  needs: (field: TranslatedText) => TranslatedText,
  fields: readonly (readonly [missing: boolean, label: TranslatedText])[],
): TranslatedText | null {
  const first = fields.find(([missing]) => missing);
  return first === undefined ? null : needs(first[1]);
}
