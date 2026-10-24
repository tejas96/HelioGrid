import type { FilterPanelWords, FilterSetWords } from '@heliogrid/domain';

export type { FilterPanelWords, FilterSetWords };

import type { FilterOption } from '../FilterBar';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

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

/**
 * **A dimension that belongs to one value of another** — Wattage and Technology belong to *Panels*
 * (`SCR-M01-15`, design-system change 8). It folds under that value as one `Accordion` line titled
 * `group`, shows only while `value` is chosen in dimension `key`, and is cleared when it is not:
 * a hidden filter that still narrowed the list would hide rows for a reason nobody can see. One
 * level deep — a dimension under a folded one never shows.
 */
export interface FilterDimensionUnder {
  /** The dimension whose value it belongs to. */
  key: string;
  /** The option of that dimension that must be chosen. */
  value: string;
  /** The folded line's title — *Panel specs*. */
  group: string;
}

interface DimensionBase {
  key: string;
  label: string;
  hint?: string;
  under?: FilterDimensionUnder;
}

/** Several values at once — `M01-38`'s certification schemes, `M07-57`'s ten outcomes. */
export interface FacetDimension extends DimensionBase {
  kind: 'facet';
  options: FilterOption[];
  counts?: Record<string, number>;
  /** What the options are, plural — *Show all 9 kinds* under a list longer than six. */
  noun?: string;
}

/** Exactly one value — the stage strip's vocabulary. */
export interface OneOfDimension extends DimensionBase {
  kind: 'one-of';
  options: FilterOption[];
  counts?: Record<string, number>;
  /** The value that means "no filter". Defaults to the first option. */
  allValue?: string;
  /** What the options are, plural — *Show all 8 technologies* under a list longer than six. */
  noun?: string;
}

/** Two ends — "wattage 300–600 W". */
export interface RangeDimension extends DimensionBase {
  kind: 'range';
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: (v: number) => string;
  anyLabel?: string;
}

/** A boolean — preferred, archived. A `Switch` row in the last *Show* section. */
export interface FlagDimension extends DimensionBase {
  kind: 'flag';
  /** The switch row's words — *Preferred items only*. Without it, `label`. */
  optionLabel?: string;
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
  words: FilterSetWords;
}

export interface FilterPanelProps extends OverlayCloseWords {
  open?: boolean;
  onClose?: () => void;
  dimensions: FilterDimension[];
  value: FilterValue;
  onChange?: (value: FilterValue) => void;
  /** Overrides the built-in reset. Without it, *Clear all* writes `clearedFilterValue()`. */
  onClear?: () => void;
  /** The footer's *Clear all*; `false` leaves the apply button alone. Default `true`. */
  showClear?: boolean;
  words: FilterPanelWords;
  /** Shown on the footer button — "Show 24 results". Omit it and the button reads `words.done`. */
  resultCount?: number;
  resultNoun?: string;
  /** Layer width at or above which the body opens as a side panel instead of a sheet. */
  panelAbove?: number;
  width?: number;
  inset?: boolean;
  /**
   * **The panel form exists so the results stay visible while you filter**, and a backdrop spends
   * exactly that. Default true, because the sheet form covers the list anyway; pass false wherever
   * the side panel sits beside the list it is filtering. Straight through to `EditorSurface`.
   */
  modal?: boolean;
  zIndex?: number;
}
