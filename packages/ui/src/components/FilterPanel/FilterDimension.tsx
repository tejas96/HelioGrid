import { FilterDimensionControl } from './FilterDimensionControl';
import type { FilterDimension, FilterDimensionValue } from './FilterPanel.types';

interface FilterDimensionBlockProps {
  dim: FilterDimension;
  value: FilterDimensionValue;
  onChange: (key: string, value: FilterDimensionValue) => void;
  active: boolean;
}

/**
 * ONE LABELLED DIMENSION: its name, the "n selected" summary a facet earns, the control its kind
 * maps to (`FilterDimensionControl`) and the hint no control of its own already carries.
 */
export function FilterDimensionBlock({ dim, value, onChange, active }: FilterDimensionBlockProps) {
  const summary =
    dim.kind === 'facet' && active && Array.isArray(value) ? `${value.length} selected` : null;
  return (
    <section className="hg-filter-dimension">
      <div className="hg-filter-dimension-head">
        <h3 className="hg-filter-dimension-label">{dim.label}</h3>
        {summary ? <span className="hg-filter-dimension-summary">{summary}</span> : null}
      </div>
      <FilterDimensionControl dim={dim} value={value} onChange={onChange} />
      {dim.kind !== 'range' && dim.hint ? (
        <p className="hg-filter-dimension-hint">{dim.hint}</p>
      ) : null}
    </section>
  );
}
