import { Provenance, ProvenanceTier } from '../Provenance';
import type { ColumnTierProps } from './DataTable.parts.types';
import { columnTierOf } from './DataTableProvenance.logic';

/**
 * **A column's tier, as a visible word** (`F8-07`) — in the header, and again on the stacked
 * card's label, so the phone and the desktop state the same fact.
 *
 * **A column whose tier matches the table-wide `provenance` renders nothing.** That is the only
 * legitimate compression of `F8-07`: the fact is still on screen, stated once above the table
 * instead of eight times across its headers. A column that says more than a tier — a standing, a
 * freshness warning, an energy source, a source, a projection — is never suppressed, and renders
 * the whole statement inline.
 */
export function ColumnTier<Row>({ column, tableSpec }: ColumnTierProps<Row>) {
  const stated = columnTierOf(column, tableSpec);
  if (stated === null) return null;
  if (stated.mode === 'inline') return <Provenance {...stated.spec} inline size={12} />;
  return <ProvenanceTier tier={stated.spec.tier} size={12} />;
}
