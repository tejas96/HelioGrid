import type { CSSProperties } from 'react';
import { useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { fieldBox } from '../../primitives/FieldBox';
import { FiltersButton } from '../FilterBar';
import type { SearchFieldProps } from './SearchField.types';

type WebSearchFieldProps = SearchFieldProps & {
  className?: string;
  style?: CSSProperties;
};

type SearchPillProps = Omit<SearchFieldProps, 'onFilterClick' | 'filterCount' | 'filterLabel'> & {
  className?: string;
  style?: CSSProperties;
};

/**
 * Borderless search input with a leading magnifier: a well (`FieldBox`) with the system focus
 * ring, never a border. Expressive is the open page's grey pill, 50 tall; functional is the dense
 * 40px box; both clear the 44px touch floor. It is the first control on every records screen:
 * leads, projects, payments, call log. With `onFilterClick` the 50×50 filter square rides beside
 * the pill — the one way into the filter sheet on a list screen.
 */
export function SearchField(props: WebSearchFieldProps) {
  if (props.onFilterClick === undefined) return <SearchPill {...props} />;
  const { onFilterClick, filterCount, filterLabel, className, style, ...pill } = props;
  return (
    <div className={classNames('hg-search-field-row', className)} style={style}>
      <SearchPill {...pill} />
      <FiltersButton onClick={onFilterClick} count={filterCount} label={filterLabel} />
    </div>
  );
}

function SearchPill({
  value,
  onChange,
  placeholder = 'Search name, phone or city',
  density = 'expressive',
  onClear,
  disabled = false,
  ariaLabel,
  className,
  style,
}: SearchPillProps) {
  const [focus, setFocus] = useState(false);
  const hasValue = value !== undefined && value !== '';
  return (
    <div
      className={classNames('hg-search-field', className)}
      data-density={density}
      {...fieldBox({ focused: focus, disabled, density })}
      style={style}
    >
      <svg
        className="hg-search-field-glyph"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className="hg-search-field-input"
        type="search"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      {hasValue && onClear !== undefined ? (
        <button
          type="button"
          className="hg-search-field-clear"
          aria-label="Clear search"
          onClick={onClear}
        >
          <span className="hg-search-field-clear-pill">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </span>
        </button>
      ) : null}
    </div>
  );
}
