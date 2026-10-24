import { Accordion } from '../Accordion';
import { FilterDimensionControl } from './FilterDimensionControl';
import { dimensionSummary, type FilterFold, foldSummary } from './FilterPanel.logic';
import type {
  FilterDimension,
  FilterDimensionValue,
  FilterSetWords,
  FilterValue,
} from './FilterPanel.types';

interface FilterDimensionBlockProps {
  dim: FilterDimension;
  value: FilterValue;
  onChange: (key: string, value: FilterDimensionValue) => void;
  words: FilterSetWords;
}

/**
 * ONE LABELLED DIMENSION: its name with what is on at its right, the control its kind maps to
 * (`FilterDimensionControl`) and the hint no control of its own already carries.
 */
export function FilterDimensionBlock({ dim, value, onChange, words }: FilterDimensionBlockProps) {
  const summary = dimensionSummary(dim, value[dim.key], words);
  return (
    <div className="hg-filter-dimension">
      <div className="hg-filter-dimension-head">
        <h3 className="hg-filter-dimension-label">{dim.label}</h3>
        {summary === null ? null : <span className="hg-filter-dimension-summary">{summary}</span>}
      </div>
      <FilterDimensionControl dim={dim} value={value[dim.key]} onChange={onChange} words={words} />
      {dim.kind !== 'range' && dim.hint ? (
        <p className="hg-filter-dimension-hint">{dim.hint}</p>
      ) : null}
    </div>
  );
}

interface FilterSectionProps extends FilterDimensionBlockProps {
  folds: FilterFold[];
}

/**
 * ONE SECTION: a dimension, then each fold whose value is chosen as one `Accordion` line — the
 * dimensions that belong to that value, folded until opened.
 */
export function FilterSection({ dim, folds, value, onChange, words }: FilterSectionProps) {
  return (
    <section className="hg-filter-section">
      <FilterDimensionBlock dim={dim} value={value} onChange={onChange} words={words} />
      {folds.length === 0 ? null : (
        <Accordion
          density="functional"
          multiple
          items={folds.map((fold) => ({
            key: fold.key,
            title: fold.title,
            meta: foldSummary(fold, value, words),
            content: (
              <div className="hg-filter-fold">
                {fold.dimensions.map((d) => (
                  <FilterDimensionBlock
                    key={d.key}
                    dim={d}
                    value={value}
                    onChange={onChange}
                    words={words}
                  />
                ))}
              </div>
            ),
          }))}
        />
      )}
    </section>
  );
}
