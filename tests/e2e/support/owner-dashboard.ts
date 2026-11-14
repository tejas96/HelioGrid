import { type createTranslator, ownerDashboardWords } from '@heliogrid/i18n';

/**
 * The owner dashboard's words a phone flow waits for (`SCR-M13-01`, `mobile/shell.yaml`): the
 * forecast's own title, which stands whether the card holds its gap — no proposal prices the
 * pipeline yet — or its figure (`T-M13-007`).
 */
export function ownerDashboardFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  return { FORECAST: ownerDashboardWords(t.t).forecastTitle };
}
