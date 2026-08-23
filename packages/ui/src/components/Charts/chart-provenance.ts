import type { ChartFrameProps } from './Charts.types';

/**
 * The provenance line under a chart's headline value (`F8-01` / `F8-07`): **the word is the
 * carrier, the dot is the second channel.** Never a tooltip, never a hover, never colour alone.
 * Parts render in the order `standing · tier · source · projection · note` — standing leads,
 * because "this is not final" outranks "this is how it was worked out".
 *
 * This module resolves the spec to token NAMES only; each platform half turns a name into
 * `var(--name)` or `theme.colors[name]`.
 *
 * The tables below DUPLICATE `components/Provenance`'s `PROVENANCE_TIERS` / `PROVENANCE_STANDINGS`
 * and its `resolveTier`, and that is duplication, not a boundary — this folder imports from
 * `../UnavailableNote` already, and nothing stops it importing from `../Provenance` too. What does
 * stop a straight swap is one field: `resolveTier` there returns a DS colour **token name**, while
 * `customColor` here is a caller's literal CSS/RN colour, which is what the design system contract
 * (`color?: string`) and `data/Provenance.jsx` (`background: color`) both specify for Charts.
 * Collapsing the two means deciding which of those two meanings `tier.color` has and changing the
 * renderer to match — a real change, tracked in the port notes, not a mechanical import.
 */

type TierName = 'measured' | 'derived' | 'estimated' | 'assumed';

interface TierObject {
  label: string;
  tone?: TierName;
  color?: string;
}

type TierSpec = TierName | 'unmarked' | string | TierObject;

type Standing = NonNullable<ChartFrameProps['standing']>;

/** Every token name the provenance line is allowed to reach for. */
export type ProvenanceColorKey =
  | 'success'
  | 'success-text'
  | 'info-text'
  | 'warning-text'
  | 'text-tertiary'
  | 'mark-subtle';

export interface ProvenanceDot {
  colorKey: ProvenanceColorKey;
  /** A caller-supplied tier colour, which the DS allows to be any CSS/RN colour string. */
  customColor?: string;
}

export interface ProvenancePart {
  id: string;
  label: string;
  dot?: ProvenanceDot;
  /** Standing takes its own word colour; every other part inherits `--text-tertiary`. */
  colorKey?: ProvenanceColorKey;
  /** Standing is the one part set in medium weight. */
  strong?: boolean;
}

const TIERS: Record<TierName, { label: string; color: ProvenanceColorKey }> = {
  measured: { label: 'Measured', color: 'success-text' },
  derived: { label: 'Derived', color: 'info-text' },
  estimated: { label: 'Estimated', color: 'warning-text' },
  assumed: { label: 'Assumed', color: 'text-tertiary' },
};

const STANDINGS: Record<
  Standing,
  { label: string; color: ProvenanceColorKey; mark: ProvenanceColorKey }
> = {
  confirmed: { label: 'Confirmed', color: 'success-text', mark: 'success' },
  provisional: { label: 'Provisional', color: 'warning-text', mark: 'warning-text' },
  reported: { label: 'Reported', color: 'warning-text', mark: 'warning-text' },
  pending: { label: 'Not yet calculated', color: 'text-tertiary', mark: 'mark-subtle' },
};

/* A canonical-looking KEY ("verified-datasheet") is title-cased; anything already written as
   words ("Tenant-provided") is printed VERBATIM. An open vocabulary that rewrites the caller's
   word is not open. */
const KEY_LIKE = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/;

function toLabel(raw: string): string {
  return KEY_LIKE.test(raw)
    ? raw.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
    : raw;
}

function isTierName(value: string): value is TierName {
  return (
    value === 'measured' || value === 'derived' || value === 'estimated' || value === 'assumed'
  );
}

/** Resolves any accepted tier spelling to a label plus a mark colour — or null for a deliberate absence. */
export function resolveTier(tier?: TierSpec): { label: string; dot: ProvenanceDot } | null {
  if (tier === undefined || tier === '' || tier === 'unmarked') {
    return null;
  }
  if (typeof tier === 'object') {
    const base = tier.tone === undefined ? undefined : TIERS[tier.tone];
    return {
      label: tier.label === '' ? (base?.label ?? '') : tier.label,
      dot: { colorKey: base?.color ?? 'text-tertiary', customColor: tier.color },
    };
  }
  if (isTierName(tier)) {
    return { label: TIERS[tier].label, dot: { colorKey: TIERS[tier].color } };
  }
  return { label: toLabel(tier), dot: { colorKey: 'text-tertiary' } };
}

export interface ProvenanceFacts {
  tier?: TierSpec;
  standing?: Standing;
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
export function provenanceParts(facts: ProvenanceFacts | null): ProvenancePart[] {
  if (facts === null) {
    return [];
  }
  const parts: ProvenancePart[] = [];
  const standing = facts.standing === undefined ? undefined : STANDINGS[facts.standing];
  if (standing !== undefined) {
    parts.push({
      id: 'standing',
      label: standing.label,
      dot: { colorKey: standing.mark },
      colorKey: standing.color,
      strong: true,
    });
  }
  const tier = resolveTier(facts.tier);
  if (tier !== null) {
    parts.push({ id: 'tier', label: tier.label, dot: tier.dot });
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
