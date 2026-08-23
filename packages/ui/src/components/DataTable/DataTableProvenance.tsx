import type { ProvenanceProps } from '../Provenance';
import { Provenance, ProvenanceTier } from '../Provenance';
import type { DataTableColumn } from './DataTableColumn.types';
import { asProvenanceSpec, columnTierMode } from './DataTableProvenance.logic';

/**
 * **A column's tier, as a visible word** (`F8-07`) — in the header, and again on the stacked
 * card's label, so the phone and the desktop state the same fact.
 *
 * **A column whose tier matches the table-wide `provenance` renders nothing.** That is the only
 * legitimate compression of `F8-07`: the fact is still on screen, stated once above the table
 * instead of eight times across its headers. A column that says more than a tier — a standing, a
 * source, a projection — is never suppressed, and renders the whole statement inline.
 */
export function ColumnTier<Row>({
  column,
  tableSpec,
}: {
  column: DataTableColumn<Row>;
  /** The table-wide statement, already resolved by the caller — one call for the whole table. */
  tableSpec: ProvenanceProps | null;
}) {
  const spec = asProvenanceSpec(column.provenance);
  const mode = columnTierMode(spec, tableSpec);
  if (spec === null || mode === 'none') {
    return null;
  }
  if (mode === 'inline') {
    return <Provenance {...spec} inline size={12} />;
  }
  return <ProvenanceTier tier={spec.tier} size={12} />;
}
