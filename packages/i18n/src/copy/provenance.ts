import type { ProvenanceStanding, ProvenanceTier, TranslatedText } from '@heliogrid/contracts';
import type { EnergySource, FreshnessWarning, ProjectionAssumption } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { energySourceLabel } from './energy-source';
import { freshnessLabel } from './freshness';

/**
 * The four tiers' words (`F8-02`). The identity stays the English token; only the display is
 * translated, and no translation may give two tiers one word (`F3-12`) — held by the registry in
 * `closed-vocabularies.ts`.
 */
export const PROVENANCE_TIER_WORD: Record<ProvenanceTier, MessageRef> = {
  measured: /*i18n*/ { id: 'Measured' },
  derived: /*i18n*/ { id: 'Derived' },
  estimated: /*i18n*/ { id: 'Estimated' },
  assumed: /*i18n*/ { id: 'Assumed' },
};

/**
 * How far a figure can be relied on as final — printed on the same label as its tier, so these
 * words must also differ from every tier word.
 */
export const PROVENANCE_STANDING_WORD: Record<ProvenanceStanding, MessageRef> = {
  confirmed: /*i18n*/ { id: 'Confirmed' },
  provisional: /*i18n*/ { id: 'Provisional' },
  reported: /*i18n*/ { id: 'Reported' },
  pending: /*i18n*/ { id: 'Not yet calculated' },
};

/** The tier in the reader's language — `translate` is the mount's `t`. */
export function tierLabel(translate: Translator['t'], tier: ProvenanceTier): TranslatedText {
  return translate(PROVENANCE_TIER_WORD[tier]);
}

/** The standing in the reader's language — `translate` is the mount's `t`. */
export function standingLabel(
  translate: Translator['t'],
  standing: ProvenanceStanding,
): TranslatedText {
  return translate(PROVENANCE_STANDING_WORD[standing]);
}

/** The word that calls a figure a projection (`F8-23`): the drawn proposal document's own. */
const PROJECTION_WORD = /*i18n*/ { id: 'A projection' };

/** Each assumption a projection states, its value in it (`F8-23`): the drawn document's words. */
const PROJECTION_ASSUMPTION_WORD: Record<ProjectionAssumption, MessageRef> = {
  horizonYears: /*i18n*/ {
    id: '{years, plural, one {over # year} other {over # years}}',
  },
  escalationRate: /*i18n*/ { id: 'rising {value}% a year' },
  interestRate: /*i18n*/ { id: 'at {value}% a year' },
  margin: /*i18n*/ { id: 'with a {value}% margin' },
  incentive: /*i18n*/ { id: 'after {value} of incentive' },
};

/**
 * Every word a provenance label prints, bound to one mount's `t` — what a root mounts
 * `ProvenanceWordsProvider` with, once, so no label falls back to English (`F3-12`).
 */
export function provenanceWords(translate: Translator['t']) {
  return {
    tier: (tier: ProvenanceTier) => tierLabel(translate, tier),
    standing: (standing: ProvenanceStanding) => standingLabel(translate, standing),
    energySource: (source: EnergySource) => energySourceLabel(translate, source),
    freshness: (warning: FreshnessWarning) => freshnessLabel(translate, warning),
    projection: translate(PROJECTION_WORD),
    assumption: (kind: ProjectionAssumption, value: string) =>
      kind === 'horizonYears'
        ? translate(PROJECTION_ASSUMPTION_WORD.horizonYears, { years: Number(value), value })
        : translate(PROJECTION_ASSUMPTION_WORD[kind], { value }),
  };
}
