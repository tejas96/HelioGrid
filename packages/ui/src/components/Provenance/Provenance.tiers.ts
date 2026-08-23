/* Provenance's registries and its resolver — platform-neutral, so both halves and VersionDiff's
   tier comparison read the same words and the same mark tokens.

   THE TIER VOCABULARY IS OPEN. The four canonical names are conveniences, not a closed enum:
   M12-34 forbids the word "measured" on the usage screen, the catalog (M01-35) needs
   verified-datasheet / tenant-provided / representative, and the studio picker (MS4-07) needs
   manufacturer-datasheet / installer-pricebook / tenant-provided. Any string is a tier; an object
   can borrow a canonical tone for its mark.

   ABSENCE CAN BE DELIBERATE. M05-52 states that the geometric access numbers carry no marker and
   "that absence is itself required". `tier="unmarked"` renders nothing AND says so in the source,
   which is distinguishable from having forgotten. */

import type {
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceStanding,
  ProvenanceTierName,
  ProvenanceTierSpec,
  ResolvedTier,
} from './Provenance.types';

export const PROVENANCE_TIERS: Record<ProvenanceTierName, ResolvedTier> = {
  measured: { label: 'Measured', color: 'success-text' },
  derived: { label: 'Derived', color: 'info-text' },
  estimated: { label: 'Estimated', color: 'warning-text' },
  assumed: { label: 'Assumed', color: 'text-tertiary' },
};

/** How far a figure can be relied on as final — the second axis (M11-42 / M06-41 / F5-59 / M05-06). */
export const PROVENANCE_STANDINGS: Record<
  ProvenanceStanding,
  { label: string; color: ProvenanceMarkToken; mark: ProvenanceMarkToken }
> = {
  confirmed: { label: 'Confirmed', color: 'success-text', mark: 'success' },
  provisional: { label: 'Provisional', color: 'warning-text', mark: 'warning-text' },
  reported: { label: 'Reported', color: 'warning-text', mark: 'warning-text' },
  pending: { label: 'Not yet calculated', color: 'text-tertiary', mark: 'mark-subtle' },
};

/* A canonical-looking KEY ("verified-datasheet") is title-cased into a label; anything a caller
   already wrote as words ("Tenant-provided", "Actual usage") is printed VERBATIM. An open
   vocabulary that rewrites the caller's word isn't open. */
const KEY_LIKE = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/;

function toLabel(s: string): string {
  const raw = String(s);
  return KEY_LIKE.test(raw)
    ? raw.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
    : raw;
}

function canonical(name: string): ResolvedTier | undefined {
  return PROVENANCE_TIERS[name as ProvenanceTierName];
}

/** Resolves any accepted tier spelling to `{label, color}` — or null for a deliberate absence. */
export function resolveTier(tier?: ProvenanceTierSpec): ResolvedTier | null {
  if (!tier || tier === 'unmarked') {
    return null;
  }
  if (typeof tier === 'object') {
    const base = tier.tone ? PROVENANCE_TIERS[tier.tone] : null;
    return {
      label: tier.label || base?.label || '',
      color: tier.color || base?.color || 'text-tertiary',
    };
  }
  return canonical(tier) ?? { label: toLabel(tier), color: 'text-tertiary' };
}

/** True when a spec would render NOTHING — lets a host skip the slot without guessing. */
export function isProvenanceEmpty(p: ProvenanceProps = {}): boolean {
  return !resolveTier(p.tier) && !p.standing && !p.source && !p.projection && !p.note;
}

/** The clamped type step. The contract is 12 or 13; never below 12 — the type floor. */
export function provenanceStep(size: number): 12 | 13 {
  return size >= 13 ? 13 : 12;
}
