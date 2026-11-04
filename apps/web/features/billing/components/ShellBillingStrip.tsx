'use client';
import { useBillingStrip } from '@heliogrid/data/react';
import { billingActFailureWords, shellBillingWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { BillingStripSlot, shellBillingOf, useFormat } from '@heliogrid/ui';
import { usePathname } from 'next/navigation';
import { BILLING_PATH, BILLING_PLANS_PATH } from '../constants';
import { useBillingStripAdapter } from '../hooks/use-billing-strip-adapter';

/** Billing and the plans draw their own strip, with the act in their body (decision 3a). */
const OWN_STRIP = new Set([BILLING_PATH, BILLING_PLANS_PATH]);

/**
 * `SCR-SHELL-06`'s strip in the web shell's slot: what `useBillingStrip` reads and
 * `shellBillingOf` builds, the phone's too. Nothing at all with no condition.
 */
export function ShellBillingStrip() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const pathname = usePathname();
  const screen = useBillingStrip(useBillingStripAdapter());
  const words = shellBillingWords(t, locale);
  const { strip } = shellBillingOf(screen.read, words, {
    format,
    now: Date.now(),
    audience: screen.audience,
  });
  if (strip === null || OWN_STRIP.has(pathname)) return null;
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
