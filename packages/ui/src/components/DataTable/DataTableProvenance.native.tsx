import { Provenance, ProvenanceTier } from '../Provenance/Provenance.native';
import type { ProvenanceProps } from '../Provenance/Provenance.types';
import type { DataTableColumn } from './DataTableColumn.types';
import { asProvenanceSpec, columnTierMode } from './DataTableProvenance.logic';

/**
 * **A column's tier, as a visible word** (`F8-07`) — in the header, and again on the stacked
 * card's label. The suppression rule is `DataTableProvenance.logic`'s, shared with the web half,
 * so the two platforms cannot disagree about which columns repeat the table-wide statement.
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
