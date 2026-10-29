import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { FacetChips } from './FacetChips';
import { filtersButtonName } from './FilterBar.logic';
import type { FiltersButtonProps, ScopeToggleProps, SortPillsProps } from './FilterBar.types';
import { optionLabel, optionValue } from './FilterBar.types';
import { FilterChips } from './FilterChips';

interface WebScopeToggleProps extends ScopeToggleProps {
  className?: string;
  style?: CSSProperties;
}

interface WebSortPillsProps extends SortPillsProps {
  className?: string;
  style?: CSSProperties;
}

interface WebFiltersButtonProps extends FiltersButtonProps {
  className?: string;
  style?: CSSProperties;
}

/** Two-or-three-way scope switch. Active = near-black pill, the primary-action marker. */
export function ScopeToggle({ options, value, onChange, className, style }: WebScopeToggleProps) {
  return (
    <div role="tablist" className={classNames('hg-scope-toggle', className)} style={style}>
      {options.map((option) => {
        const optValue = optionValue(option);
        const active = optValue === value;
        return (
          <button
            key={optValue}
            type="button"
            role="tab"
            aria-selected={active}
            className="hg-filter-target"
            onClick={() => onChange?.(optValue)}
          >
            <span
              className="hg-filter-pill"
              data-pill="scope"
              data-active={active ? 'true' : undefined}
            >
              {optionLabel(option)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** "Sort" label + inline pills. Active = accent fill. */
export function SortPills({
  options,
  value,
  onChange,
  label,
  className,
  style,
}: WebSortPillsProps) {
  return (
    <div className={classNames('hg-sort-pills', className)} style={style}>
      <span className="hg-sort-pills-label">{label}</span>
      {options.map((option) => {
        const optValue = optionValue(option);
        const active = optValue === value;
        return (
          <button
            key={optValue}
            type="button"
            aria-pressed={active}
            className="hg-filter-target"
            onClick={() => onChange?.(optValue)}
          >
            <span
              className="hg-filter-pill"
              data-pill="sort"
              data-active={active ? 'true' : undefined}
            >
              {optionLabel(option)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The filter square that opens the filter body — `FilterPanel`, **at every width**, beside the
 * search pill (`SearchField`'s `onFilterClick` draws it). 50×50, the near-black primary fill
 * (pressed darker), radius `--r-field`, white sliders; the active count rides its top-right
 * corner. Not a phone affordance: on desktop the same body opens as a side panel, because a
 * six-dimension set has no room in a toolbar row at either size (`F7-31`).
 */
export function FiltersButton({
  onClick,
  count = 0,
  label,
  activeLabel,
  className,
  style,
}: WebFiltersButtonProps) {
  return (
    <button
      type="button"
      className={classNames('hg-filters-button', className)}
      aria-label={filtersButtonName({ count, label, activeLabel })}
      title={label}
      onClick={onClick}
      style={style}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <ShellGlyphMarks name="sliders" />
      </svg>
      {count > 0 ? (
        <span className="hg-filters-badge" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </button>
  );
}

export { FacetChips, FilterChips };

/** All filter controls as one namespace object — the whole filtering vocabulary as one unit. */
export const FilterBar = {
  ScopeToggle,
  FilterChips,
  FacetChips,
  SortPills,
  FiltersButton,
};
