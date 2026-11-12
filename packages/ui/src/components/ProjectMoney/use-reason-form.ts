import { footOf, sendWhen } from '../ProjectActSheet/ProjectActSheet.logic';
import { useTypedDraft } from '../ProjectActSheet/use-typed-draft';
import type { MoneySheetForm, MoneySheetProps } from './ProjectMoney.parts.types';

export type ReasonProps = MoneySheetProps & {
  readonly form: Extract<MoneySheetForm, { kind: 'reverse' | 'waive' }>;
};

/** Why a payment is taken back or a part waived: one line, required, then its send. */
export function useReasonForm({ form, words, sending, failure }: ReasonProps) {
  const reason = useTypedDraft('', sending);
  const reverse = form.kind === 'reverse';
  return {
    field: { label: words.why, ...reason.field },
    send: {
      label: reverse ? words.reverse : words.waive,
      ...footOf({ sending, refusal: failure }),
      ...sendWhen(reason.typed, form.onSend),
      glyph: reverse ? ('undo' as const) : null,
      destructive: true,
    },
  };
}
