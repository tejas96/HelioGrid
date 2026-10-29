import { Provenance, ProvenanceTier } from '../Provenance/Provenance.native';
import type { ColumnTierProps } from './DataTable.parts.types';
import { columnTierOf } from './DataTableProvenance.logic';

/**
 * **A column's tier, as a visible word** (`F8-07`) — in the header, and again on the stacked
 * card's label. The suppression rule is `DataTableProvenance.logic`'s, shared with the web half,
 * so the two platforms cannot disagree about which columns repeat the table-wide statement.
 */
export function ColumnTier<Row>({ column, tableSpec }: ColumnTierProps<Row>) {
  const stated = columnTierOf(column, tableSpec);
  if (stated === null) return null;
  if (stated.mode === 'inline') return <Provenance {...stated.spec} inline size={12} />;
  return <ProvenanceTier tier={stated.spec.tier} size={12} />;
}
