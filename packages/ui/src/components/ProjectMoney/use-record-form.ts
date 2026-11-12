import { amountAgainstLeft } from '@heliogrid/domain';
import { useEffect, useState } from 'react';
import { useFormat } from '../MarketProvider';
import { footOf } from '../ProjectActSheet/ProjectActSheet.logic';
import { referenceOf, startAmountOf } from './MoneySheet.logic';
import type { MoneySheetForm, MoneySheetProps } from './ProjectMoney.parts.types';

export type RecordProps = MoneySheetProps & {
  readonly form: Extract<MoneySheetForm, { kind: 'record' }>;
};

/**
 * The record sheet's draft and its send, the same on both halves: the amount starts as what the
 * part still owes, the first mode the market declares, today's date. While the amount is typed it
 * says how it stands against what is left; while the UTR is typed, whether a receipt already
 * carries it — and a UTR the save was refused for is said at its field until another is typed.
 */
export function useRecordForm({ form, words, sending, failure, failureField }: RecordProps) {
  const format = useFormat();
  const digits = format.pack.minorUnitDigits;
  const [amount, setAmount] = useState<number | null>(Number(startAmountOf(form)));
  const [mode, setMode] = useState<string | null>(form.modes[0] ?? null);
  const [reference, setReference] = useState('');
  const [receivedOn, setReceivedOn] = useState(form.today);
  const [retyped, setRetyped] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new refusal is shown again
  useEffect(() => setRetyped(false), [failure]);
  const atReference = failureField === 'reference' && !retyped ? failure : null;
  const against = amountAgainstLeft(amount, form.part.outstanding, digits);
  const standing = form.reference;
  const ready = amount !== null && amount > 0 && mode !== null;
  return {
    digits,
    amount,
    amountHint:
      against === null
        ? words.amountHint
        : {
            matches: words.amountMatches,
            less: words.amountLess,
            more: words.amountMore,
          }[against],
    setAmount,
    clearAmount: () => setAmount(null),
    mode,
    setMode,
    modeOptions: form.modes.map((one) => ({
      value: one,
      label: words.mode(one),
      disabled: sending,
    })),
    reference,
    typeReference: (typed: string) => {
      setReference(typed);
      setRetyped(true);
      form.onReference(typed);
    },
    referenceError:
      atReference ??
      (standing.kind === 'used' ? words.referenceUsed(standing.receiptNumber) : undefined),
    referenceHelper: standing.kind === 'new' ? words.referenceNew : words.referenceHint,
    receivedOn,
    pickDate: (value: unknown) => {
      if (typeof value === 'string') setReceivedOn(value);
    },
    send: {
      label: words.save(amount === null ? '' : format.money(amount.toFixed(digits))),
      ...footOf({ sending, refusal: atReference === null ? failure : null }),
      ready,
      onSend: () => {
        if (!ready || amount === null || mode === null) return;
        form.onSend({
          partId: form.part.id,
          amount: amount.toFixed(digits),
          mode,
          reference: referenceOf(reference),
          receivedOn,
        });
      },
      glyph: 'tick' as const,
      destructive: false,
    },
  };
}
