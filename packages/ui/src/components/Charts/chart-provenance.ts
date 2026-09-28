import type { ProvenanceStanding, ProvenanceTier } from '@heliogrid/contracts';
import type { EnergySource, Freshness } from '@heliogrid/domain';
import {
  FRESHNESS_MARK,
  freshnessWarning,
  STANDING_MARK,
  TIER_MARK,
  tierOf,
} from '../Provenance/Provenance.tiers';
import type { ProvenanceWords } from '../Provenance/Provenance.types';
import type { ChartFrameProps } from './Charts.types';

/**
 * The provenance line under a chart's headline value (`F8-01` / `F8-07`): **the word is the
 * carrier, the dot is the second channel.** Never a tooltip, never a hover, never colour alone.
 * Parts render in the order `standing · freshness · tier · energy source · source · projection ·
 * note`, the label's — standing and freshness lead, because "this is not final" outranks "this is
 * how it was worked out".
 *
 * The marks are `components/Provenance`'s and the words are the consumer's (`ProvenanceWords`), so
 * a chart and a label cannot disagree about a tier. This module resolves the spec to token NAMES
 * only; each platform half turns a name into `var(--name)` or `theme.colors[name]`.
 */

/** Every token name the provenance line reaches for — exactly the marks `Provenance` uses. */
export type ProvenanceColorKey =
  | (typeof TIER_MARK)[ProvenanceTier]
  | (typeof STANDING_MARK)[ProvenanceStanding][keyof (typeof STANDING_MARK)[ProvenanceStanding]];

export interface ProvenanceDot {
  colorKey: ProvenanceColorKey;
}

export interface ProvenancePart {
  id: string;
  label: string;
  dot?: ProvenanceDot;
  /** Standing and freshness take their own word colour; every other part inherits `--text-tertiary`. */
  colorKey?: ProvenanceColorKey;
  /** Standing and freshness are the parts set in medium weight. */
  strong?: boolean;
}

export interface ProvenanceFacts {
  tier?: Exclude<ChartFrameProps['provenance'], object>;
  standing?: ProvenanceStanding;
  freshness?: Freshness | null;
  energySource?: EnergySource | null;
  source?: string;
  projection?: string;
  note?: string;
}

type FrameProvenanceInput = Pick<
  ChartFrameProps,
  'provenance' | 'standing' | 'source' | 'projection' | 'note'
>;

type ProvenanceObject = Extract<ChartFrameProps['provenance'], object>;

/** A spec's own field, or `undefined` when this object shape does not carry that field. */
function field<K extends keyof ProvenanceFacts>(
  spec: ProvenanceObject,
  key: K,
): ProvenanceFacts[K] | undefined {
  return key in spec ? (spec as ProvenanceFacts)[key] : undefined;
}

/**
 * ONE provenance line per frame: a spec object wins field by field, and the frame's own
 * `standing` / `source` / `projection` / `note` fill its gaps.
 */
export function chartProvenanceFacts(input: FrameProvenanceInput): ProvenanceFacts | null {
  const { provenance, standing, source, projection, note } = input;
  if (typeof provenance === 'object') {
    return {
      tier: field(provenance, 'tier'),
      standing: field(provenance, 'standing') ?? standing,
      freshness: field(provenance, 'freshness'),
      energySource: field(provenance, 'energySource'),
      source: field(provenance, 'source') ?? source,
      projection: field(provenance, 'projection') ?? projection,
      note: field(provenance, 'note') ?? note,
    };
  }
  const anyFact = [provenance, standing, source, projection, note].some(
    (value) => value !== undefined,
  );
  return anyFact ? { tier: provenance, standing, source, projection, note } : null;
}

/** The line's parts, in order. Empty means the line renders nothing at all. */
export function provenanceParts(
  facts: ProvenanceFacts | null,
  words: ProvenanceWords,
): ProvenancePart[] {
  if (facts === null) {
    return [];
  }
  const parts: ProvenancePart[] = [];
  if (facts.standing !== undefined) {
    const standing = STANDING_MARK[facts.standing];
    parts.push({
      id: 'standing',
      label: words.standing(facts.standing),
      dot: { colorKey: standing.mark },
      colorKey: standing.color,
      strong: true,
    });
  }
  const warning = freshnessWarning(facts.freshness);
  if (warning !== null) {
    parts.push({
      id: 'freshness',
      label: words.freshness(warning),
      dot: { colorKey: FRESHNESS_MARK.mark },
      colorKey: FRESHNESS_MARK.color,
      strong: true,
    });
  }
  const tier = tierOf(facts.tier);
  if (tier !== null) {
    parts.push({ id: 'tier', label: words.tier(tier), dot: { colorKey: TIER_MARK[tier] } });
  }
  if (facts.energySource !== undefined && facts.energySource !== null) {
    parts.push({ id: 'energySource', label: words.energySource(facts.energySource) });
  }
  if (facts.source !== undefined && facts.source !== '') {
    parts.push({ id: 'source', label: facts.source });
  }
  if (facts.projection !== undefined && facts.projection !== '') {
    parts.push({ id: 'projection', label: facts.projection });
  }
  if (facts.note !== undefined && facts.note !== '') {
    parts.push({ id: 'note', label: facts.note });
  }
  return parts;
}
