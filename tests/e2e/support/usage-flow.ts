import {
  BILLING_HOME,
  type createTranslator,
  usagePageWords,
  usageViewWords,
} from '@heliogrid/i18n';

/** The usage screen's words (`SCR-M12-04`): its cards, the meters a fresh trial shows and a ledger's. */
export function usageWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const view = usageViewWords(t.t, 'en');
  const page = usagePageWords(t.t);
  return {
    ALL_USAGE: t.t(BILLING_HOME.allUsage),
    USAGE_LIMITS: view.limits,
    USAGE_INCLUDED: view.included,
    VOICE_MINUTES: view.view.limits.voiceMinutes,
    OTP_CODES: view.otpCodes,
    NOT_BILLED: view.notBilled,
    VOICE_EVENTS: page.eventsOf(view.view.limits.voiceMinutes),
    NO_CALLS: view.noCalls.title,
    USAGE_CLOSE: page.close,
  };
}
