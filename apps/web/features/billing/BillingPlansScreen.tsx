'use client';
import { BILLING_HOME, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyShellPage } from '../shell';

/**
 * The plans (`SCR-M12-03`) before they are built: the shell's *coming later* page, so `Change plan`
 * and `Pick a plan` lead somewhere real (RFC D11). T-M12-003 replaces it.
 */
export function BillingPlansScreen() {
  const t = useTranslate();
  return <EmptyShellPage title={t(BILLING_HOME.changePlan)} description={t(SHELL.comingLater)} />;
}
