import type { CSSProperties } from 'react';
import { useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { SearchFieldProps } from './SearchField.types';

interface WebSearchFieldProps extends SearchFieldProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Borderless search input with a leading magnifier. e1 at rest, 2px accent ring on focus,
 * never a border. 44px tall so it clears the touch-target floor on a phone. It is the first
 * control on every records screen: leads, projects, payments, call log.
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search name, phone or city',
  density = 'expressive',
  onClear,
  disabled = false,
  ariaLabel,
  className,
  style,
}: WebSearchFieldProps) {
  const [focus, setFocus] = useState(false);
  const hasValue = value !== undefined && value !== '';
  return (
    <div
      className={classNames('hg-search-field', className)}
      data-density={density}
      data-disabled={disabled}
      data-focus={focus}
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
