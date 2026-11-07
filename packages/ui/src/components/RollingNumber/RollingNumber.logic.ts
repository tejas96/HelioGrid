/** One stretch of a figure: a digit that rolls, or marks that stand still (₹, commas, %, a unit). */
export type FigurePart =
  | { readonly kind: 'digit'; readonly digit: number }
  | { readonly kind: 'mark'; readonly text: string };

/** The column every rolling digit slides through, top to bottom. */
export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/** A figure as its rolling digits and the marks between them; marks next to each other stay one. */
export function figureParts(value: string): readonly FigurePart[] {
  const parts: FigurePart[] = [];
  for (const char of value) {
    const digit = DIGITS.indexOf(char as (typeof DIGITS)[number]);
    if (digit >= 0) {
      parts.push({ kind: 'digit', digit });
      continue;
    }
    const last = parts.at(-1);
    if (last?.kind === 'mark') parts[parts.length - 1] = { kind: 'mark', text: last.text + char };
    else parts.push({ kind: 'mark', text: char });
  }
  return parts;
}
