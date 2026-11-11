import type { TranslatedText } from '@heliogrid/contracts';
import { useState } from 'react';
import type { ButtonProps } from '../Button/Button.types';
import type { DatePickerProps } from '../DatePicker/DatePicker.types';
import { useFormat } from '../MarketProvider';
import type { NumberFieldProps } from '../NumberField/NumberField.types';
import {
  dateErrorOf,
  draftToSend,
  faultsOf,
  figureOf,
  gapsOf,
  isComplete,
  type MarkWonGaps,
  sendFailureOf,
  valueErrorOf,
} from './MarkWonSheet.logic';
import type { MarkWonManagerFieldProps, MarkWonSheetProps } from './MarkWonSheet.types';

const NO_GAPS: MarkWonGaps = { value: false, date: false, manager: false };

/** *Mark won*'s form as both halves draw it: its three fields, the failure above the send, the send. */
export interface MarkWonForm {
  readonly value: NumberFieldProps;
  readonly date: DatePickerProps;
  readonly manager: MarkWonManagerFieldProps;
  readonly failure: TranslatedText | null;
  readonly send: Omit<ButtonProps, 'children'>;
  /** The send itself — Enter in a typed field on the web presses it too. */
  readonly onSend: () => void;
}

/**
 * The form's draft as fields. What it lacks is said under each field only once a send was tried;
 * what is wrong with it — too fine for the currency, nothing, a day behind today — is said as it is
 * typed. A send while one is out sends nothing, and an incomplete or faulty draft is never sent.
 */
export function useMarkWonForm({
  words,
  today,
  draft,
  onChange,
  managers,
  sending,
  failure,
  onSend,
}: MarkWonSheetProps): MarkWonForm {
  const { pack } = useFormat();
  const [tried, setTried] = useState(false);
  const toSend = draftToSend(draft, managers);
  const gaps = tried ? gapsOf(toSend) : NO_GAPS;
  const faults = faultsOf(draft, today, pack.minorUnitDigits);
  const send = () => {
    if (sending) return;
    setTried(true);
    if (isComplete(gapsOf(toSend), faults)) onSend(toSend);
  };
  return {
    value: {
      label: words.finalValue,
      words: words.numberField,
      value: figureOf(draft.finalValue),
      onCommit: (value) => onChange({ ...draft, finalValue: String(value) }),
      onClear: () => onChange({ ...draft, finalValue: '' }),
      commits: 'as-typed',
      currency: true,
      outOfRange: 'refuse',
      min: 0,
      disabled: sending,
      error: valueErrorOf(words, faults, gaps.value, failure),
    },
    date: {
      label: words.installDate,
      words: words.date,
      value: draft.expectedInstallOn === '' ? undefined : draft.expectedInstallOn,
      onChange: (value) => {
        if (typeof value === 'string') onChange({ ...draft, expectedInstallOn: value });
      },
      min: today,
      disabled: sending,
      error: dateErrorOf(words, faults, gaps.date, failure),
    },
    manager: {
      words,
      managers,
      managerId: toSend.managerId,
      missing: gaps.manager,
      disabled: sending,
      onChoose: (managerId) => onChange({ ...draft, managerId }),
    },
    failure: sendFailureOf(failure, words),
    send: { variant: 'primary', size: 'lg', fullWidth: true, loading: sending, onClick: send },
    onSend: send,
  };
}
