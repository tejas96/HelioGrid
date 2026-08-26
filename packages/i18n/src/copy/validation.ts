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
 * Builds the message function `installFormsErrorMap` takes, bound to the caller's own
 * translator. It used to read this package's i18n SINGLETON, which is why the singleton
 * existed at all; the translator is passed in now, so nothing here is shared state.
 *
 * **The boundary, stated plainly:** `installFormsErrorMap` mutates zod's PROCESS-GLOBAL
 * error map. That cannot be per-request, so this is a CLIENT concern — one app mount has
 * exactly one active language, and the runtime handed in is that mount's. Server-side and
 * background translation uses `createTranslator(locale)` and never touches zod's error map.
 * A server-rendered form needing translated zod defaults is a new decision, not an
 * extension of this one.
 */
export function createFormsValidationMessage(
  translate: (id: string) => string,
): (issue: ValidationIssueLike) => string | undefined {
  return (issue) => {
    if (issue.code === 'invalid_type') {
      return translate(issue.received === 'undefined' ? MSG.required.id : MSG.invalid.id);
    }
    if (issue.code === 'too_small') {
      const emptyRequiredString = issue.type === 'string' && issue.minimum === 1;
      return translate(emptyRequiredString ? MSG.required.id : MSG.tooSmall.id);
    }
    if (issue.code === 'too_big') {
      return translate(MSG.tooBig.id);
    }
    if (issue.code === 'invalid_string') {
      return translate(MSG.invalid.id);
    }
    return undefined;
  };
}
