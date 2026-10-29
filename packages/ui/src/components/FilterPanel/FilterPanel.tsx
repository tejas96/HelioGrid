import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { EditorSurface } from '../EditorSurface';
import { FilterSection } from './FilterDimension';
import { FilterDimensionControl } from './FilterDimensionControl';
import {
  clearedFilterValue,
  countActiveFilters,
  dimensionChangeOf,
  FILTER_PANEL_DEFAULTS,
  filterFooterOf,
  filterLayout,
  isFilterActive,
} from './FilterPanel.logic';
import type { FilterPanelProps, FilterSetProps } from './FilterPanel.types';

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
 * **One column of sections at every width** (design-system change 8): each dimension's name with
 * what is on at its right, its control under it, a hairline between; every flag is a `Switch` row
 * in a last *Show* section.
 *
 * **Nothing is staged.** A change writes through `onChange` immediately and the list behind
 * updates — with every folded dimension whose value is no longer chosen cleared in the same write.
 */
export function FilterSet({
  dimensions = [],
  value = {},
  onChange,
  words,
  className,
  style,
}: WebFilterSetProps) {
  const setOne = dimensionChangeOf(dimensions, value, onChange);
  const { sections, flags } = filterLayout(dimensions, value);
  return (
    <div className={classNames('hg-filter-set', className)} style={style}>
      {sections.map(({ dim, folds }) => (
        <FilterSection
          key={dim.key}
          dim={dim}
          folds={folds}
          value={value}
          onChange={setOne}
          words={words}
        />
      ))}
      {flags.length === 0 ? null : (
        <section className="hg-filter-section">
          <h3 className="hg-filter-dimension-label">{words.show}</h3>
          <div className="hg-filter-flags">
            {flags.map((dim) => (
              <div key={dim.key} className="hg-filter-flag-row">
                <FilterDimensionControl
                  dim={dim}
                  value={value[dim.key]}
                  onChange={setOne}
                  words={words}
                />
                {dim.hint ? <p className="hg-filter-dimension-hint">{dim.hint}</p> : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * `FilterSet` inside an `EditorSurface`: **a sheet below 720px of the layer's own width, a side
 * panel at or above it** — the same one column in both. *Clear all* shows once, here in the
 * footer. The footer's primary action is a **labelled dismiss** ("Show 24 results"), never an
 * apply — the filters are already on.
 */
export function FilterPanel({
  open = false,
  onClose,
  closeLabel,
  dimensions = [],
  value = {},
  onChange,
  onClear,
  showClear = true,
  words,
  resultCount,
  resultNoun,
  panelAbove = FILTER_PANEL_DEFAULTS.panelAbove,
  width = FILTER_PANEL_DEFAULTS.width,
  inset = false,
  modal = true,
  zIndex = FILTER_PANEL_DEFAULTS.zIndex,
  style,
}: WebFilterPanelProps) {
  const { nothingOn, clear, doneLabel } = filterFooterOf({
    dimensions,
    value,
    onChange,
    onClear,
    resultCount,
    resultNoun,
    words,
  });
  const footer = (
    <div className="hg-filter-panel-footer">
      {showClear ? (
        <button
          type="button"
          className="hg-filter-panel-clear"
          onClick={clear}
          disabled={nothingOn}
        >
          {words.clearAll}
        </button>
      ) : null}
      <button type="button" className="hg-filter-panel-done" onClick={onClose}>
        {doneLabel}
      </button>
    </div>
  );
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={closeLabel}
      title={words.title}
      panelAbove={panelAbove}
      width={width}
      footer={footer}
      inset={inset}
      modal={modal}
      zIndex={zIndex}
      showClose
      style={style}
    >
      <FilterSet dimensions={dimensions} value={value} onChange={onChange} words={words} />
    </EditorSurface>
  );
}

FilterSet.countActive = countActiveFilters;
FilterSet.cleared = clearedFilterValue;
FilterSet.isActive = isFilterActive;
FilterPanel.Set = FilterSet;
FilterPanel.countActive = countActiveFilters;
