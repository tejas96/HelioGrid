import { isValidElement } from 'react';
import { resolveTier } from '../Provenance/Provenance.tiers';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance/Provenance.types';
import type { DataTableProvenanceSpec } from './DataTable.types';

/* THE TIER IS A WORD IN THE HEADER, not a dot with a tooltip (F8-07). A column repeats it only
   when it differs from the table-wide statement — the one compression that is legitimate, because
   nothing is hidden: the fact is still on screen, just stated once instead of eight times.

   Decided here, once, for both platform halves: two `ColumnTier`s that each worked out the
   suppression rule for themselves is how the phone comes to state a tier the desktop suppresses. */

/**
 * **A provenance statement, in the one shape the rules are written against.** A spec object stays
 * a spec; anything else — a tier name, a caller's own word — becomes a bare `{tier}`. An element a
 * caller pre-rendered is not a spec and carries no comparable tier, so it resolves to none.
 */
export function asProvenanceSpec(
  provenance: DataTableProvenanceSpec | null | undefined,
): ProvenanceProps | null {
  if (provenance === null || provenance === undefined || provenance === '') {
    return null;
  }
  if (typeof provenance === 'object') {
    return isValidElement(provenance) ? null : (provenance as ProvenanceProps);
  }
  return { tier: provenance as ProvenanceTierSpec };
}

/**
 * **Which of the three things a column's provenance does**, in the design system's order:
 *
 * - `none` — its tier is the table-wide statement's, and it carries nothing else. It does not
 *   repeat it.
 * - `inline` — it says more than a tier (a standing, a source, a projection), so the whole
 *   statement renders inline. A column that differs always states its own.
 * - `tier` — the tier alone, as a visible word.
 */
export type ColumnTierMode = 'none' | 'inline' | 'tier';

export function columnTierMode(
  spec: ProvenanceProps | null,
  tableSpec: ProvenanceProps | null,
): ColumnTierMode {
  if (spec === null) {
    return 'none';
  }
  /* More than a tier is never suppressed: the table-wide statement cannot be standing in for a
     source or a projection it does not carry. */
  const detailed = Boolean(spec.standing || spec.source || spec.projection);
  const tier = resolveTier(spec.tier);
  const tableTier = tableSpec === null ? null : resolveTier(tableSpec.tier);
  const sameAsTable =
    !detailed && tier !== null && tableTier !== null && tier.label === tableTier.label;
  if (sameAsTable) {
    return 'none';
  }
  return detailed ? 'inline' : 'tier';
}
