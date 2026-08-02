import { i18n } from '@lingui/core';

/**
 * Translated copy for zod's DEFAULT validation messages (foundation-dx spec §2.4). Same
 * pattern as api-error.ts: pure data, extractor-swept via the leading i18n annotations,
 * no React. Schema-AUTHORED messages (e.g. the E.164 hint) are never overridden — they
 * stay English until the owning module authors copy; this map only replaces the bare
 * defaults ("Required") a user should never see untranslated.
 */
const MSG = {
  required: /*i18n*/ { id: 'This field is required.' },
  invalid: /*i18n*/ { id: 'Enter a valid value.' },
  tooSmall: /*i18n*/ { id: 'This value is too small.' },
  tooBig: /*i18n*/ { id: 'This value is too large.' },
};

/** Structural mirror of the zod issue fields we branch on — no zod dependency here. */
export interface ValidationIssueLike {
  code: string;
  received?: unknown;
  type?: unknown;
  minimum?: unknown;
}

/**
 * Translated message for a zod issue, or undefined to keep zod's own default. Uses the
 * package's i18n singleton — the same instance setupI18n() activates, so the active
 * locale always applies.
 */
export function formsValidationMessage(issue: ValidationIssueLike): string | undefined {
  if (issue.code === 'invalid_type') {
    return i18n._(issue.received === 'undefined' ? MSG.required.id : MSG.invalid.id);
  }
  if (issue.code === 'too_small') {
    const emptyRequiredString = issue.type === 'string' && issue.minimum === 1;
    return i18n._(emptyRequiredString ? MSG.required.id : MSG.tooSmall.id);
  }
  if (issue.code === 'too_big') {
    return i18n._(MSG.tooBig.id);
  }
  if (issue.code === 'invalid_string') {
    return i18n._(MSG.invalid.id);
  }
  return undefined;
}
