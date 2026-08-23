import type { SelectOption } from './Select.types';

/**
 * Strings or `{value,label,…}` objects arrive on the same prop; every consumer wants the object.
 * One declaration so the two platform halves cannot normalise it two ways.
 */
export function normaliseOptions(options: readonly (SelectOption | string)[]): SelectOption[] {
  return options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
}

/** First option whose label starts with the typed letter — the type-ahead jump. */
export function findByFirstLetter(options: readonly SelectOption[], letter: string): number {
  const needle = letter.toLowerCase();
  return options.findIndex((option) => option.label.toLowerCase().startsWith(needle));
}
