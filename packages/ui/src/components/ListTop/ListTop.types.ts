import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { FilterChipsProps } from '../FilterBar/FilterBar.types';
import type {
  FilterDimension,
  FilterPanelWords,
  FilterValue,
} from '../FilterPanel/FilterPanel.types';
import type { HueTileTone } from '../HueTile/HueTile.types';
import type { SearchFieldProps } from '../SearchField/SearchField.types';
import type { SegmentedControlProps } from '../SegmentedControl/SegmentedControl.types';
import type { StageMeterProps } from '../StageMeter/StageMeter.types';

/**
 * One figure of a list's summary: a count and what it counts. A figure with `onPress` narrows the
 * list to what it counts (the dormant leads), or opens where they wait (the inbox).
 */
export interface ListFigure {
  /** The count as a numeral — a fact, not copy. */
  readonly value: string;
  readonly label: TranslatedText;
  /** What a screen reader says for the figure: the count and its word, as one phrase. */
  readonly spoken: TranslatedText;
  readonly onPress?: () => void;
  /** A figure that narrows the list is on while its filter is — the dormant leads shown. */
  readonly pressed?: boolean;
  /** A side figure's glyph on its tint, drawn before the count; decorative — the words say it. */
  readonly glyph?: { readonly name: ShellGlyphName; readonly hue: HueTileTone };
}

/**
 * The list's one hero (`HeroPanel`, solar glass): its main figure large, the two that need the
 * person beside it, and — where the room is wide — the stages as one band under them.
 */
export interface ListSummaryProps {
  /** What the figures are about — read by a screen reader as the hero's name. */
  readonly name: TranslatedText;
  /** The hero's overline — *Today · Wednesday, 11 Nov*. */
  readonly label: TranslatedText;
  readonly lead: ListFigure;
  readonly side: readonly ListFigure[];
  /** The stages by count: a thin bar in the narrow room, the meter's band in the wide one. */
  readonly stages: StageMeterProps | null;
  /** A line under the figures — *Nothing needs you today* — or null. */
  readonly note: TranslatedText | null;
}

/** One way a list can be ordered, by its key and its words. */
export interface ListSortChoice {
  readonly key: string;
  readonly label: TranslatedText;
}

/**
 * How the list is ordered. Narrow, a sort glyph opens a sheet of choices that sorts on the tap;
 * wide, a button that names the order opens the same choices as a menu.
 */
export interface ListSortProps {
  /** The sheet's title and the glyph's name — *Sort leads*. */
  readonly title: TranslatedText;
  /** The wide button's spoken name with the order in it — *Sort: Newest first*. */
  readonly spokenName: (chosen: TranslatedText) => TranslatedText;
  readonly choices: readonly ListSortChoice[];
  readonly chosen: string;
  readonly onChoose: (key: string) => void;
  readonly closeLabel: TranslatedText;
}

/**
 * What narrows the list beyond its chips: the filter circle with how many are on, and the filter
 * body — a sheet on the phone, a side panel where the room is wide (`FilterPanel`).
 */
export interface ListFilterProps {
  readonly label: TranslatedText;
  readonly activeLabel: (count: number) => TranslatedText;
  /** How many filters are on, the circle's counter. */
  readonly on: number;
  readonly dimensions: FilterDimension[];
  readonly value: FilterValue;
  readonly onChange: (value: FilterValue) => void;
  readonly onClear: () => void;
  readonly words: FilterPanelWords;
  readonly closeLabel: TranslatedText;
  /** The footer's count — *Show 12 results*; null where the list does not know it. */
  readonly resultCount: number | null;
}

/** The room the list has: `narrow` the phone and a narrow window, `wide` the table's room. */
export type ListRoom = 'narrow' | 'wide';

/**
 * **The top every list page shares** (`.claude/rules/ui-adherence.md`, *List page top*), both
 * platforms: the summary hero, whose list where there is a choice, the search with the sort and the
 * filter beside it, then the chips that narrow it in one tap, in one row that scrolls sideways.
 * It stays while the list reads again and when nothing matches, so the way back is never hidden.
 */
export interface ListTopProps {
  readonly summary: ListSummaryProps;
  /** Whose list — mine, all, the inbox; null where there is no choice to make. */
  readonly scope: SegmentedControlProps | null;
  readonly search: SearchFieldProps;
  readonly sort: ListSortProps;
  readonly filter: ListFilterProps;
  /** The quick chips: one choice at a time, *All* first. */
  readonly chips: Omit<FilterChipsProps, 'scroll' | 'ref'>;
  readonly room: ListRoom;
}
