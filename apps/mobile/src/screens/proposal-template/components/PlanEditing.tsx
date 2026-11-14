import type { PaymentTermsScreen } from '@heliogrid/data/react';
import { paymentTermsWords, stageWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { termsContextOf, termsLetterheadOf, useFormat } from '@heliogrid/ui';
import { TermsEditing } from '../../payment-terms/components/TermsEditing';

/**
 * The payment-terms editor opened from Proposal defaults (`T-M01-030`: *New plan* and *Change this
 * plan*): the same sheet, stage picker and asks Payment terms draws (`SCR-M01-20`), over the same
 * `usePaymentTermsScreen` — never a second editor.
 */
export function PlanEditing({ plans }: { plans: PaymentTermsScreen }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const { page } = plans;
  const editor = page.editor;
  if (editor === null) return null;
  const words = paymentTermsWords(t);
  return (
    <TermsEditing
      screen={plans}
      editor={editor}
      words={words}
      context={termsContextOf(words, stageWords(t), locale, format)}
      letterhead={termsLetterheadOf(page.cover, page.brandColour, format.pack.taxIdLabel)}
    />
  );
}
