'use client';
import { useBillingStrip } from '@heliogrid/data/react';
import { billingActFailureWords, billingDenialWords, shellBillingWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { BillingDenial, shellBillingOf, useFormat } from '@heliogrid/ui';
import { useBillingStripAdapter } from '../hooks/use-billing-strip-adapter';

/**
 * The one denial (`SCR-SHELL-06`, `M12-21`): any save the billing gate refuses, on any page, opens
 * it — a centred modal at 1536, a sheet at 375. Mounted once beside the portal host, so a refusal
 * outside the shell is shown too. Its act is the strip's; closing it returns focus to the control.
 */
export function BillingDenialHost() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useBillingStrip(useBillingStripAdapter());
  const billing = shellBillingOf(screen.read, shellBillingWords(t, locale), {
    format,
    now: Date.now(),
    audience: screen.audience,
  });
  const denial = screen.refusal === null ? null : billing.denialOf(screen.refusal.blocked);
  return (
    <BillingDenial
      denial={denial}
      words={billingDenialWords(t)}
      onAct={() => {
        if (denial?.act) screen.act(denial.act.go);
      }}
      onClose={screen.dismissRefusal}
      acting={screen.acting}
      failure={screen.failed ? billingActFailureWords(t, 'other') : null}
    />
  );
}
