import { type createTranslator, settingsRowName } from '@heliogrid/i18n';

/*
 * The settings list's rows in words for the phone flows (`mobile/settings.yaml` and each row's own
 * flow), handed to Maestro by `mobile-cli.ts`.
 */

/** Each settings row's name, `ROW_<row>`, as the settings list and the row's own header show it. */
export function settingsFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const rows = [
    'profile',
    'team',
    'roles',
    'branding',
    'proposal_templates',
    'payment_terms',
    'collections',
    'catalog',
    'billing',
  ] as const;
  return Object.fromEntries(
    rows.map((row) => [`ROW_${row.toUpperCase()}`, settingsRowName(t.t, row)]),
  );
}
