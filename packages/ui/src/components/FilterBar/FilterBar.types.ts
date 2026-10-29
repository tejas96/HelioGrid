import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode, Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';

/* THE TOUCH TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES (N2 / F7-29 / F7-32).

   All four parts appear unchanged on a 375px phone, so every one clears 44×44. Each control's
   target is 44px and the pill drawn inside it keeps its own height: scope 36, sort 32. The kind
   and stage chips are 44 — the pill IS the target — and the filter square is 50×50, above the
   floor. Where a pill is shorter, the difference is transparent padding owned by the target.

   This is expressed once, in the component, rather than left to twenty records screens to
   remember. Callers get the floor for free and cannot opt out of it. */

/**
 * A bare string is a value that is its own words — a figure, a name; product words come in the
 * object form, `label` in the reader's language. `icon` — an 18px glyph drawn before the label
 * (kind chips), in the chip's own ink: an inline `<svg>` stroked in `currentColor` on the web, a
 * `react-native-svg` element stroked in `currentColor` on the phone, which the chip hands its
 * words' colour.
 */
export type FilterOption = string | { value: string; label: TranslatedText; icon?: ReactNode };

/** The pill heights and the filter square's side, one declaration for both platforms. */
export const PILL_HEIGHT = {
  scope: 36,
  chip: 44,
  sort: 32,
  filters: 50,
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
  label?: TranslatedText;
  /**
   * Id of a name already visible on the screen — preferred over `label` whenever one exists
   * (Kanban points this at its own visible overline, so one string does both jobs).
   */
  labelledBy?: string;
  /**
   * A focus handle for the caller, which sends focus to the chosen chip after it changes the choice
   * itself (*Show all*): web focuses the selected tab, native moves the screen reader's focus to it.
   */
  ref?: Ref<FocusHandle>;
}

export interface FacetChipsProps {
  options: FilterOption[];
  /** Every selected value. A set, not a value. */
  values?: string[];
  onChange?: (values: string[]) => void;
  counts?: Record<string, number>;
  /** Accessible name for the group — "Certification scheme", "Outcome". */
  label?: TranslatedText;
  /**
   * The tick's name on the web — *Selected* — read with a chosen chip's words. The phone says the
   * same through the chip's selected state, which its tick cannot carry.
   */
  selectedLabel: TranslatedText;
  /** Single scrolling row instead of wrapping. */
  scroll?: boolean;
}

export interface SortPillsProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** The word before the pills — *Sort*. */
  label: TranslatedText;
}

export interface FiltersButtonProps {
  onClick?: () => void;
  /** Number of active filters — shown as an accent counter. */
  count?: number;
  /** The square's name and its title — *Filters*. */
  label: TranslatedText;
  /**
   * The square's whole spoken name while `count` is above zero — *Filters, 3 active*. The square
   * has no words and the counter is a bare number, so the name must say what the number counts.
   */
  activeLabel: (count: number) => TranslatedText;
}

/** `{ value, label, icon }` for a plain string option or a spec object, in one place. */
export function optionValue(option: FilterOption): string {
  return typeof option === 'string' ? option : option.value;
}

export function optionLabel(option: FilterOption): string {
  return typeof option === 'string' ? option : option.label;
}

export function optionIcon(option: FilterOption): ReactNode {
  return typeof option === 'string' ? undefined : option.icon;
}
