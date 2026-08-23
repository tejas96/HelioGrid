import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Icon } from '../../primitives/Icon';
import { FacetChips } from './FacetChips';
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
  label = 'Sort',
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
 * White pill that opens the filter body — `FilterPanel`, **at every width**. Not a phone
 * affordance: on desktop the same body opens as a side panel, because a six-dimension set has no
 * room in a toolbar row at either size (`F7-31`). 36px pill in a 44px target.
 */
export function FiltersButton({
  onClick,
  count = 0,
  label = 'Filters',
  className,
  style,
}: WebFiltersButtonProps) {
  return (
    <button
      type="button"
      className={classNames('hg-filter-target', className)}
      /* THE COUNTER IS A BARE NUMBER, and a bare number is not a name. Left to the content the
         button announced "Filters 3" — the badge saying nothing about what the 3 counts. The
         native half states the whole sentence; this is the same one, so both halves name the
         control identically. */
      aria-label={count > 0 ? `${label}, ${count} active` : label}
      onClick={onClick}
      style={style}
    >
      <span className="hg-filter-pill" data-pill="filters">
        <Icon size="sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </Icon>
        {label}
        {count > 0 ? <span className="hg-filters-badge">{count}</span> : null}
      </span>
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
