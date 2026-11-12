import { useState } from 'react';
import { useFormat } from '../MarketProvider';
import { type CollectWay, firstWayOf } from './MoneySheet.logic';
import type { MoneySheetForm, MoneySheetWords } from './ProjectMoney.parts.types';

/** The collect sheet's two ways to pay and the one shown — UPI first, the bank above the cap. */
export function useCollectWay(
  form: Extract<MoneySheetForm, { kind: 'collect' }>,
  words: MoneySheetWords,
) {
  const format = useFormat();
  const [way, setWay] = useState<CollectWay>(firstWayOf(form));
  return {
    way,
    switcher: {
      ariaLabel: words.collectTitle(format.money(form.request.amount)),
      value: way,
      onChange: (value: string) => setWay(value === 'bank' ? 'bank' : 'upi'),
      options: [
        { value: 'upi', label: words.upiTab },
        { value: 'bank', label: words.bankTab },
      ],
    },
  };
}
