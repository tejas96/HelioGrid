'use client';
import { useCompanyProfile } from '@heliogrid/data/react';
import { companyProfileStepWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CompanyProfile, useFormat } from '@heliogrid/ui';

/**
 * The third setup step on the web (`SCR-M01-05`, `M01-24`), drawn by the inside group's gate for
 * an owner whose company still owes it. What is read, typed and saved is `useCompanyProfile`'s,
 * and every word is `companyProfileStepWords`'. This composes.
 */
export function CompanyProfileScreen() {
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const step = useCompanyProfile();
  return (
    <CompanyProfile
      words={companyProfileStepWords(t, locale, step, pack)}
      values={step.values}
      open={step.open}
      onOpen={step.openPart}
      onEdit={step.edit}
      onChooseSegment={step.chooseSegment}
      onDeclareSize={step.declareSize}
      saving={step.saving}
      onSave={step.save}
      onRetryRead={step.retryRead}
      onContinueWithout={step.continueWithout}
    />
  );
}
