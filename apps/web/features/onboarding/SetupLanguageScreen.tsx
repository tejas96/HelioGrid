'use client';
import { useSetupLanguage } from '@heliogrid/data/react';
import { setupLanguageWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { SetupLanguage } from '@heliogrid/ui';

/**
 * The first setup step on the web (`SCR-M01-03`, `F3-03`), drawn by the inside group's gate for an
 * owner whose company still owes it. A tap is the provider's `setLocale`, which redraws and saves
 * at once; the way on is `useSetupLanguage`'s, and every word is `setupLanguageWords`'. This
 * composes.
 */
export function SetupLanguageScreen() {
  const { locale, device, setLocale, t } = useI18n();
  const step = useSetupLanguage();
  return (
    <SetupLanguage
      words={setupLanguageWords(t, { device, failed: step.failed })}
      language={locale}
      onChoose={(next) => void setLocale(next)}
      saving={step.saving}
      onContinue={() => step.record(locale)}
      onContinueAnyway={step.putOff}
    />
  );
}
