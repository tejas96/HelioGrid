import type { TranslatedText } from '@heliogrid/contracts';
import type { Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';

interface SearchFieldOwnProps {
  value?: string;
  onChange?: (value: string) => void;
  /** The words in the empty pill, and its spoken name when there is no `ariaLabel`. Required. */
  placeholder: TranslatedText;
  disabled?: boolean;
  ariaLabel?: TranslatedText;
  /**
   * A focus handle for the caller, which sends focus here after the thing it acted on leaves (a
   * row removed, a list cleared): web focuses the input, native the `TextInput`.
   */
  ref?: Ref<FocusHandle>;
}

/** A clear button once there's a value. */
interface SearchFieldClearing {
  /** Shows a clear button once there's a value. */
  onClear?: () => void;
  /**
   * The clear button's spoken name ("Clear search"). Required with `onClear`: the button carries
   * no words, so this is all a screen reader hears.
   */
  clearLabel: TranslatedText;
}

/** No clear button. */
interface SearchFieldNotClearing {
  onClear?: undefined;
  clearLabel?: undefined;
}

/** The search pill alone. */
interface SearchFieldAloneProps extends SearchFieldOwnProps {
  onFilterClick?: undefined;
  filterCount?: undefined;
  filterLabel?: undefined;
  filterActiveLabel?: undefined;
}

/** The search pill with the filter circle beside it. */
interface SearchFieldWithFilterProps extends SearchFieldOwnProps {
  /** Draws the 50 filter circle beside the pill; opens the filter sheet. */
  onFilterClick: () => void;
  /** Active filter count on the circle — feed `FilterSet.countActive`. */
  filterCount?: number;
  /**
   * Accessible name of the filter circle. Required with `onFilterClick`: the circle carries no
   * words, so this is all a screen reader hears, and the caller passes it from `@heliogrid/i18n`.
   */
  filterLabel: TranslatedText;
  /**
   * The circle's whole spoken name while `filterCount` is above zero — *Filters, 3 active* — the
   * `activeLabel` `FiltersButton` takes.
   */
  filterActiveLabel: (count: number) => TranslatedText;
}

/**
 * The one search look (direction A): a 50-tall pill, magnifier left, tertiary placeholder, the accent
 * ring on focus — in a page's list, a sheet and the sidebar alike, so no screen draws its own. Pass
 * `onFilterClick` with its `filterLabel` for the filter circle beside it.
 */
export type SearchFieldProps = (SearchFieldAloneProps | SearchFieldWithFilterProps) &
  (SearchFieldClearing | SearchFieldNotClearing);
