import { type createTranslator, ownerDashboardWords } from '@heliogrid/i18n';

/** The owner dashboard's words a phone flow waits for (`SCR-M13-01`, `mobile/shell.yaml`). */
export function ownerDashboardFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  return { FORECAST_GAP: ownerDashboardWords(t.t).forecastGap };
}
