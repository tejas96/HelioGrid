import {
  type FreshnessWarning,
  type PackKey,
  PINNED_INPUTS,
  type PinnedInput,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

/**
 * What a figure that is not current says beside its tier (`F8-18`). `current` has no word: the
 * comparison said current, and the type refuses it before it reaches here.
 */
export const FRESHNESS_WORD: Record<FreshnessWarning['kind'], MessageRef> = {
  stale: /*i18n*/ { id: 'Out of date: {changes} changed' },
  recomputing: /*i18n*/ { id: 'Recalculating' },
  unchecked: /*i18n*/ { id: 'Not checked' },
};

/**
 * What moved, as a reader names it. A moved market pack is named by the keys that moved, so it
 * has no word of its own: "market pack" is nothing a reader can act on.
 */
export const PINNED_INPUT_WORD: Record<Exclude<PinnedInput, 'marketPack'>, MessageRef> = {
  design: /*i18n*/ { id: 'design' },
  catalogRelease: /*i18n*/ { id: 'catalog' },
  tenantPriceBook: /*i18n*/ { id: 'price book' },
  engines: /*i18n*/ { id: 'calculation method' },
};

export const PACK_KEY_WORD: Record<PackKey, MessageRef> = {
  tax: /*i18n*/ { id: 'tax rates' },
  subsidy: /*i18n*/ { id: 'subsidy rules' },
  callingRules: /*i18n*/ { id: 'calling rules' },
  paymentRails: /*i18n*/ { id: 'payment methods' },
  certificationSchemes: /*i18n*/ { id: 'certification schemes' },
  formats: /*i18n*/ { id: 'number formats' },
  dataRights: /*i18n*/ { id: 'data rights' },
  priceBook: /*i18n*/ { id: 'market prices' },
};

/** One separator in every language, as the energy source's database list uses. */
const CHANGE_SEPARATOR = ', ';

/**
 * The freshness warning in the reader's language — `translate` is the mount's `t`. A stale figure
 * names what moved in `PINNED_INPUTS` order, the pack's keys standing where the pack stands.
 */
export function freshnessLabel(translate: Translator['t'], freshness: FreshnessWarning): string {
  if (freshness.kind !== 'stale') return translate(FRESHNESS_WORD[freshness.kind]);
  const changes = PINNED_INPUTS.filter((input) => freshness.moved.includes(input)).flatMap(
    (input) =>
      input === 'marketPack'
        ? freshness.movedPackKeys.map((key) => translate(PACK_KEY_WORD[key]))
        : [translate(PINNED_INPUT_WORD[input])],
  );
  return translate(FRESHNESS_WORD.stale, { changes: changes.join(CHANGE_SEPARATOR) });
}
