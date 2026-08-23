/* THE TOUCH TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES (N2 / F7-29 / F7-32).

   All four parts appear unchanged on a 375px phone, so every one clears 44×44 — but a 44px-tall
   pill turns a dense desktop filter row into a toolbar of buttons. So each control's target is
   44px and the pill drawn inside it keeps its own height: scope 36, chips 34, sort 32, filters 36.
   The difference is transparent padding owned by the target.

   This is expressed once, in the component, rather than left to twenty records screens to
   remember. Callers get the floor for free and cannot opt out of it. */

export type FilterOption = string | { value: string; label: string };

/** The pill heights, one declaration for both platforms. Never above the 44px touch floor. */
export const PILL_HEIGHT = {
  scope: 36,
  chip: 34,
  sort: 32,
  filters: 36,
} as const;

export interface ScopeToggleProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export interface FilterChipsProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Optional count per option key, shown inside the chip. */
  counts?: Record<string, number>;
  /** Horizontal scroll for the phone row. */
  scroll?: boolean;
  /** **The tablist's accessible name** — "Stage", "Outcome". A tablist with no name is a defect. */
  label?: string;
  /**
   * Id of a name already visible on the screen — preferred over `label` whenever one exists
   * (Kanban points this at its own visible overline, so one string does both jobs).
   */
  labelledBy?: string;
}

export interface FacetChipsProps {
  options: FilterOption[];
  /** Every selected value. A set, not a value. */
  values?: string[];
  onChange?: (values: string[]) => void;
  counts?: Record<string, number>;
  /** Accessible name for the group — "Certification scheme", "Outcome". */
  label?: string;
  /** Single scrolling row instead of wrapping. */
  scroll?: boolean;
}

export interface SortPillsProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

export interface FiltersButtonProps {
  onClick?: () => void;
  /** Number of active filters — shown as an accent counter. */
  count?: number;
  label?: string;
}

/** `{ value, label }` for a plain string option or a spec object, in one place. */
export function optionValue(option: FilterOption): string {
  return typeof option === 'string' ? option : option.value;
}

export function optionLabel(option: FilterOption): string {
  return typeof option === 'string' ? option : option.label;
}
