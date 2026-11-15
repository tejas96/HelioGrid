import type { SystemType } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/** The notices step 3 raises (`M06-30`, `T-M06-024`): a battery the system needs, a tax it cannot collect. */

type T = Translator['t'];

const NOTICE = {
  noTaxTitle: /*i18n*/ { id: 'Your company has no {tax} number' },
  noTaxOwner: /*i18n*/ {
    id: 'A company cannot collect a tax it is not registered for. Add the number in Business profile when you have it.',
  },
  noTaxOther: /*i18n*/ { id: 'So no {tax} prints. {owner} can add the number.' },
  batteryRequired: /*i18n*/ { id: 'Battery required' },
  batteryRequiredLine: /*i18n*/ { id: 'An off-grid system cannot work without one.' },
  batteryAdd: /*i18n*/ { id: 'Add a battery' },
  batteryAddLine: /*i18n*/ { id: 'A hybrid system stores power in a battery.' },
  addIt: /*i18n*/ { id: 'Add one' },
} as const;

/** The battery notice a system type raises while it holds no battery (`M06-30`). */
export function proposalBatteryNoticeWords(t: T, systemType: SystemType) {
  const offGrid = systemType === 'off_grid';
  return {
    tone: offGrid ? ('danger' as const) : ('warning' as const),
    title: t(offGrid ? NOTICE.batteryRequired : NOTICE.batteryAdd),
    line: t(offGrid ? NOTICE.batteryRequiredLine : NOTICE.batteryAddLine),
    act: t(NOTICE.addIt),
  };
}

/** The no-registration notice (`T-M06-024`): the price is the price, and the step says why. */
export function proposalNoTaxNoticeWords(t: T, facts: { taxName: string; owner?: string }) {
  return {
    title: t(NOTICE.noTaxTitle, { tax: facts.taxName }),
    line:
      facts.owner === undefined
        ? t(NOTICE.noTaxOwner)
        : t(NOTICE.noTaxOther, { tax: facts.taxName, owner: facts.owner }),
  };
}
