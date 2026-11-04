import { useBillingStrip } from '@heliogrid/data/react';
import { billingActFailureWords, shellBillingWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { BillingStripSlot, shellBillingOf, useFormat } from '@heliogrid/ui';
import { useRoute } from '@react-navigation/native';
import { useBillingStripAdapter } from '../use-billing-strip-adapter';

/** Billing and the plans draw their own strip, with the act in their body (decision 3a). */
function drawsOwnStrip(route: { name: string; params?: object }): boolean {
  if (route.name === 'BillingPlans') return true;
  const segment = (route.params as { segment?: string } | undefined)?.segment;
  return route.name === 'SettingsRow' && segment === 'billing';
}

/**
 * `SCR-SHELL-06`'s strip, pinned between the top bar and the scrolling content: what
 * `useBillingStrip` reads and `shellBillingOf` builds, the web's too. Nothing at all — no slot —
 * with no condition.
 */
export function ShellBillingStrip() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const route = useRoute();
  const screen = useBillingStrip(useBillingStripAdapter());
  const words = shellBillingWords(t, locale);
  const { strip } = shellBillingOf(screen.read, words, {
    format,
    now: Date.now(),
    audience: screen.audience,
  });
  if (strip === null || drawsOwnStrip(route)) return null;
  return (
    <BillingStripSlot
      read={strip}
      words={words}
      onAct={() => {
        if (strip.kind === 'ready' && strip.value.act !== null) screen.act(strip.value.act.go);
      }}
      acting={screen.acting}
      failure={screen.failed ? billingActFailureWords(t, 'other') : null}
    />
  );
}
