import { z } from 'zod';

interface IssueLike {
  code: string;
  received?: unknown;
  type?: unknown;
  minimum?: unknown;
}

/**
 * Route zod's DEFAULT messages through a translator (foundation-dx spec §2.4) — called
 * once at app start with @heliogrid/i18n's formsValidationMessage. Schema-authored
 * messages bypass the map entirely (zod consults it only when no message was given), and
 * a translator returning undefined keeps zod's own default.
 */
export function installFormsErrorMap(translate: (issue: IssueLike) => string | undefined): void {
  z.setErrorMap((issue, ctx) => ({ message: translate(issue) ?? ctx.defaultError }));
}
