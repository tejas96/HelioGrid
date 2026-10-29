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

/** The picked option, or none while the value matches no option. */
export function pickedOption(
  options: readonly SelectOption[],
  value: string | undefined,
): SelectOption | undefined {
  return options.find((option) => option.value === value);
}

/** The list opens on the picked option, or on the first when none is picked. */
export function openingIndex(options: readonly SelectOption[], value: string | undefined): number {
  return Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
}

/** The option a commit at `index` takes, or none: a disabled option refuses the commit. */
export function committableOption(
  options: readonly SelectOption[],
  index: number,
): SelectOption | undefined {
  const option = options[index];
  return option === undefined || option.disabled === true ? undefined : option;
}

/** First option whose label starts with the typed letter — the type-ahead jump. */
export function findByFirstLetter(options: readonly SelectOption[], letter: string): number {
  const needle = letter.toLowerCase();
  return options.findIndex((option) => option.label.toLowerCase().startsWith(needle));
}
