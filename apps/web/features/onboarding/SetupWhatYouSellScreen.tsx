'use client';
import { useSetupWhatYouSell } from '@heliogrid/data/react';
import { setupWhatYouSellWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { SetupWhatYouSell } from '@heliogrid/ui';

/**
 * The second setup step on the web (`SCR-M01-04`, `M01-23`), drawn by the inside group's gate for
 * an owner whose company still owes it. The answers, the refusal and the way on are
 * `useSetupWhatYouSell`'s, and every word is `setupWhatYouSellWords`'. This composes.
 */
export function SetupWhatYouSellScreen() {
  const { t } = useI18n();
  const step = useSetupWhatYouSell();
  return (
    <SetupWhatYouSell
      words={setupWhatYouSellWords(t, step)}
      segment={step.answers.segment}
      onChooseSegment={step.chooseSegment}
      typicalSystemKwp={step.answers.typicalSystemKwp}
      onDeclareSize={step.declareSize}
      saving={step.saving}
      refusals={step.refusals}
      onContinue={step.submit}
      onFinishLater={step.putOff}
    />
  );
}
