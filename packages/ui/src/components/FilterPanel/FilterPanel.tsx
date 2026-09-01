import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { EditorSurface } from '../EditorSurface';
import { FilterDimensionBlock } from './FilterDimension';
import {
  clearedFilterValue,
  countActiveFilters,
  filterHeaderLine,
  isFilterActive,
} from './FilterPanel.logic';
import type { FilterDimensionValue, FilterPanelProps, FilterSetProps } from './FilterPanel.types';

interface WebFilterSetProps extends FilterSetProps {
  className?: string;
  style?: CSSProperties;
}

/* `EditorSurface` declares `style` and no `className`, and neither does the design system's own
   FilterPanel — the frame is the surface's, so the panel passes through only what it owns. */
interface WebFilterPanelProps extends FilterPanelProps {
  style?: CSSProperties;
}

/**
 * **The one filter body, and it renders no chrome** — no title, no backdrop, no frame. That is
 * what lets the same body serve the mobile sheet, the desktop side panel and an inline settings
 * block without a second implementation.
 *
 * **Nothing is staged.** A change writes through `onChange` immediately and the list behind
 * updates. An Apply button would need a draft model, a discard-on-close rule and an answer for
 * what a live result count means while a draft is unapplied — three inventions to save one
 * gesture.
 */
export function FilterSet({
  dimensions = [],
  value = {},
  onChange,
  columns = 1,
  onClear,
  showClear = true,
  header = true,
  className,
  style,
}: WebFilterSetProps) {
  const n = countActiveFilters(dimensions, value);
  const setOne = (key: string, v: FilterDimensionValue) => onChange?.({ ...value, [key]: v });
  const clear = () => (onClear ? onClear() : onChange?.(clearedFilterValue(dimensions)));
  return (
    <div className={classNames('hg-filter-set', className)} style={style}>
      {header ? (
        <div className="hg-filter-set-header">
          <span className="hg-filter-set-count">{filterHeaderLine(n, dimensions.length)}</span>
          {showClear && n > 0 ? (
            <button type="button" className="hg-filter-set-clear" onClick={clear}>
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="hg-filter-set-grid" data-columns={columns}>
        {dimensions.map((d) => (
          <FilterDimensionBlock
            key={d.key}
            dim={d}
            value={value[d.key]}
            onChange={setOne}
            active={isFilterActive(d, value[d.key])}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * `FilterSet` inside an `EditorSurface`: **a sheet below 720px of the layer's own width, a side
 * panel at or above it.** Filtering inherits `F7-21`'s switch instead of answering it a second
 * time. The footer's primary action is a **labelled dismiss** ("Show 24 results"), never an
 * apply — the filters are already on.
 */
export function FilterPanel({
  open = false,
  onClose,
  dimensions = [],
  value = {},
  onChange,
  onClear,
  title = 'Filters',
  resultCount,
  resultNoun = 'results',
  panelAbove = 720,
  width = 460,
  inset = false,
  modal = true,
  zIndex = 40,
  style,
}: WebFilterPanelProps) {
  const n = countActiveFilters(dimensions, value);
  const clear = () => (onClear ? onClear() : onChange?.(clearedFilterValue(dimensions)));
  const footer = (
    <div className="hg-filter-panel-footer">
      <button type="button" className="hg-filter-panel-clear" onClick={clear} disabled={n === 0}>
        Clear all
      </button>
      <button type="button" className="hg-filter-panel-done" onClick={onClose}>
        {typeof resultCount === 'number' ? `Show ${resultCount} ${resultNoun}` : 'Done'}
      </button>
    </div>
  );
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      title={title}
      panelAbove={panelAbove}
      width={width}
      footer={footer}
      inset={inset}
      modal={modal}
      zIndex={zIndex}
      showClose
      style={style}
    >
      {({ panel }: { panel: boolean }) => (
        <FilterSet
          dimensions={dimensions}
          value={value}
          onChange={onChange}
          onClear={onClear}
          columns={panel ? 2 : 1}
        />
      )}
    </EditorSurface>
  );
}

FilterSet.countActive = countActiveFilters;
FilterSet.cleared = clearedFilterValue;
FilterSet.isActive = isFilterActive;
FilterPanel.Set = FilterSet;
FilterPanel.countActive = countActiveFilters;
