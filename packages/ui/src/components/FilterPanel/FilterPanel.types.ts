import type { FilterOption } from '../FilterBar';

/**
 * What one dimension holds. The design system declares the map as `Record<string, any>`; the
 * shared contract spells the union its own doc names instead — `string[]` for a facet, `string`
 * for a one-of, `[number, number]` for a range, `boolean` for a flag, `null` for cleared.
 */
export type FilterDimensionValue =
  | string[]
  | string
  | [number, number]
  | boolean
  | null
  | undefined;

/** `{ [dimension key]: string[] | string | [number, number] | boolean | null }`. */
export type FilterValue = Record<string, FilterDimensionValue>;

/** Several values at once — `M01-38`'s certification schemes, `M07-57`'s ten outcomes. */
export interface FacetDimension {
  key: string;
  label: string;
  kind: 'facet';
  options: FilterOption[];
  counts?: Record<string, number>;
  hint?: string;
}

/** Exactly one value — the stage strip's vocabulary. */
export interface OneOfDimension {
  key: string;
  label: string;
  kind: 'one-of';
  options: FilterOption[];
  counts?: Record<string, number>;
  hint?: string;
  /** The value that means "no filter". Defaults to the first option. */
  allValue?: string;
}

/** Two ends — "wattage 300–600 W". */
export interface RangeDimension {
  key: string;
  label: string;
  kind: 'range';
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: (v: number) => string;
  anyLabel?: string;
  hint?: string;
}

/** A boolean — preferred, archived. */
export interface FlagDimension {
  key: string;
  label: string;
  kind: 'flag';
  optionLabel?: string;
  hint?: string;
}

/**
 * A filter dimension. Four kinds, each rendered by a control that already exists in the system —
 * a filter body is an arrangement, not a new look.
 */
export type FilterDimension = FacetDimension | OneOfDimension | RangeDimension | FlagDimension;

export interface FilterSetProps {
  dimensions: FilterDimension[];
  value: FilterValue;
  onChange?: (value: FilterValue) => void;
  /** 1 or 2 columns. A panel has room for two; a sheet does not. `FilterPanel` sets this. */
  columns?: 1 | 2;
  /** Overrides the built-in reset. Without it, "Clear all" writes `clearedFilterValue()`. */
  onClear?: () => void;
  showClear?: boolean;
  /** The "3 of 6 filters on" line. Drop it when the host already says so. */
  header?: boolean;
}

export interface FilterPanelProps {
  open?: boolean;
  onClose?: () => void;
  dimensions: FilterDimension[];
  value: FilterValue;
  onChange?: (value: FilterValue) => void;
  onClear?: () => void;
  title?: string;
  /** Shown on the footer button — "Show 24 results". Omit it and the button reads "Done". */
  resultCount?: number;
  resultNoun?: string;
  /** Layer width at or above which the body opens as a side panel instead of a sheet. */
  panelAbove?: number;
  width?: number;
  inset?: boolean;
  zIndex?: number;
}
