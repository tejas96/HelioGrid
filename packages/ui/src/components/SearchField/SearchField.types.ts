/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type SearchFieldDensity = 'expressive' | 'functional';

interface SearchFieldOwnProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  density?: SearchFieldDensity;
  /** Shows a clear button once there's a value. */
  onClear?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/** The search pill alone. */
interface SearchFieldAloneProps extends SearchFieldOwnProps {
  onFilterClick?: undefined;
  filterCount?: undefined;
  filterLabel?: undefined;
}

/** The search pill with the filter square beside it. */
interface SearchFieldWithFilterProps extends SearchFieldOwnProps {
  /** Draws the 50×50 black filter square beside the pill; opens the filter sheet. */
  onFilterClick: () => void;
  /** Active filter count on the square — feed `FilterSet.countActive`. */
  filterCount?: number;
  /**
   * Accessible name of the filter square. Required with `onFilterClick`: the square carries no
   * words, so this is all a screen reader hears, and the caller passes it from `@heliogrid/i18n`.
   */
  filterLabel: string;
}

/**
 * Grey search pill, magnifier left, tertiary placeholder; 1.5px accent edge on focus. Pass
 * `onFilterClick` with its `filterLabel` for the black filter square beside it.
 */
export type SearchFieldProps = SearchFieldAloneProps | SearchFieldWithFilterProps;
