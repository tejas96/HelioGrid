import type { TranslatedText } from '@heliogrid/contracts';
/**
 * What a split that must total exactly the whole says (`M01-54`, `SCR-M01-20`): the meter's
 * remainder line, and the reason *Save terms* is refused. Both read the ONE verdict
 * (`allocationVerdict`), so the meter and the save can never say different things.
 */
import { type AllocationVerdict, shareTextOf } from '@heliogrid/domain';
import type { Translator } from '../runtime';

const ALLOCATION = {
  met: /*i18n*/ { id: 'Fully allocated.' },
  under: /*i18n*/ { id: '{share}% unallocated.' },
  over: /*i18n*/ { id: '{share}% over-allocated.' },
  allocateRest: /*i18n*/ { id: 'Allocate the remaining {share}% to save these terms.' },
  takeOff: /*i18n*/ { id: 'Take {share}% off the tranches to save these terms.' },
} as const;

/**
 * The meter's own words (`packages/ui`'s `AllocationMeterWords`). Each figure arrives formatted
 * with its unit — "12%" — so the meter serves a unit other than percent with the same sentences.
 */
const ALLOCATION_METER = {
  name: /*i18n*/ { id: 'Allocation' },
  nameOf: /*i18n*/ { id: '{label} allocation' },
  ofTarget: /*i18n*/ { id: 'of {target}' },
  figure: /*i18n*/ { id: '{sum} of {target} — {remainder}' },
  under: /*i18n*/ { id: '{amount} unallocated.' },
  over: /*i18n*/ { id: '{amount} over-allocated.' },
  blocksSave: /*i18n*/ { id: 'This has to reach {target} before it can be saved.' },
  blocksGenerate: /*i18n*/ { id: 'Generate is blocked until the allocation reaches {target}.' },
  unresolved: /*i18n*/ { id: 'Nothing allocated yet.' },
} as const;

/** The remainder as a person reads it: `1200` basis points is `12`, `1` is `0.01`. */
function shareOf(verdict: AllocationVerdict): string {
  return shareTextOf(Math.abs(verdict.remainder));
}

/** The meter's line: *12% unallocated.* · *18% over-allocated.* · *Fully allocated.* */
export function allocationSentence(t: Translator['t'], verdict: AllocationVerdict): TranslatedText {
  if (verdict.state === 'met') return t(ALLOCATION.met);
  return t(verdict.state === 'under' ? ALLOCATION.under : ALLOCATION.over, {
    share: shareOf(verdict),
  });
}

/** Why the save is refused, or `null` when the split is whole. */
export function allocationRefusal(
  t: Translator['t'],
  verdict: AllocationVerdict,
): TranslatedText | null {
  if (verdict.state === 'met') return null;
  return t(verdict.state === 'under' ? ALLOCATION.allocateRest : ALLOCATION.takeOff, {
    share: shareOf(verdict),
  });
}

/** Every sentence `AllocationMeter` draws or speaks of its own, named as its `words` takes them. */
export function allocationMeterWords(t: Translator['t']) {
  return {
    name: (label?: TranslatedText): TranslatedText =>
      label === undefined ? t(ALLOCATION_METER.name) : t(ALLOCATION_METER.nameOf, { label }),
    ofTarget: (target: string) => t(ALLOCATION_METER.ofTarget, { target }),
    figure: (sum: string, target: string, remainder: TranslatedText) =>
      t(ALLOCATION_METER.figure, { sum, target, remainder }),
    met: t(ALLOCATION.met),
    under: (amount: string) => t(ALLOCATION_METER.under, { amount }),
    over: (amount: string) => t(ALLOCATION_METER.over, { amount }),
    blocksSave: (target: string) => t(ALLOCATION_METER.blocksSave, { target }),
    blocksGenerate: (target: string) => t(ALLOCATION_METER.blocksGenerate, { target }),
    unresolved: t(ALLOCATION_METER.unresolved),
  };
}
