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

/** The remainder as a person reads it: `1200` basis points is `12`, `1` is `0.01`. */
function shareOf(verdict: AllocationVerdict): string {
  return shareTextOf(Math.abs(verdict.remainder));
}

/** The meter's line: *12% unallocated.* · *18% over-allocated.* · *Fully allocated.* */
export function allocationSentence(t: Translator['t'], verdict: AllocationVerdict): string {
  if (verdict.state === 'met') return t(ALLOCATION.met);
  return t(verdict.state === 'under' ? ALLOCATION.under : ALLOCATION.over, {
    share: shareOf(verdict),
  });
}

/** Why the save is refused, or `null` when the split is whole. */
export function allocationRefusal(t: Translator['t'], verdict: AllocationVerdict): string | null {
  if (verdict.state === 'met') return null;
  return t(verdict.state === 'under' ? ALLOCATION.allocateRest : ALLOCATION.takeOff, {
    share: shareOf(verdict),
  });
}
