import type { RichTextValue } from '@heliogrid/domain';

const CLAUSE =
  'Work at each stage starts when its part of the payment is received, and the site is ready for it.';

/**
 * Terms long enough that the page plan prints them on more than one sheet and short enough to stay
 * within their three (`M06-15`): `count` numbered clauses — 18 print on two sheets, 40 run past three.
 */
export function numberedTerms(count: number): RichTextValue {
  return {
    version: 1,
    blocks: Array.from({ length: count }, (_, index) => ({
      type: 'p',
      spans: [{ text: `${index + 1}. ${CLAUSE}` }],
    })),
  };
}

/** Two sheets of terms. */
export const TWO_SHEET_TERMS = numberedTerms(18);

/** Terms the plan would print past three sheets: an edit holding them is refused. */
export const OVER_LONG_TERMS = numberedTerms(40);
