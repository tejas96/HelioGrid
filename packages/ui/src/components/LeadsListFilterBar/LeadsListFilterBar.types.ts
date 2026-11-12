import type { TranslatedText } from '@heliogrid/contracts';
import type {
  LeadSource,
  LeadStage,
  LeadsListFilters,
  LeadsListSort,
  LeadsPipeline,
  LeadsWhose,
} from '@heliogrid/domain';
import type { FilterPanelWords } from '../FilterPanel/FilterPanel.types';
import type { ListRoom } from '../ListTop/ListTop.types';
import type { SegmentedOption } from '../SegmentedControl/SegmentedControl.types';
import type { StageMeterWords } from '../StageMeter/StageMeter.types';

/** What the bar reads and sets on the list's screen; `useLeadsListScreen` satisfies it. */
export interface LeadsListFilterBarScreen {
  readonly filters: LeadsListFilters;
  /** Whose leads, narrowest first; a single choice and no inbox draws no switch. */
  readonly whoseChoices: readonly LeadsWhose[];
  readonly inboxOffered: boolean;
  /** How many wait in the inbox; null while it is not read. */
  readonly inboxWaiting: number | null;
  setWhose(whose: LeadsWhose): void;
  pickStage(stage: LeadStage): void;
  toggleDormant(): void;
  setSource(source: LeadSource | null): void;
  setSort(sort: LeadsListSort): void;
  setQuery(query: string): void;
}

/** Every word the bar says, built in `@heliogrid/i18n` (`leadsListWords`). */
export interface LeadsListFilterBarWords {
  readonly whoseLabel: TranslatedText;
  /** Each scope the reader may choose by its word, then the inbox with how many wait in it. */
  readonly whoseOptions: (
    facts: Pick<LeadsListFilterBarScreen, 'whoseChoices' | 'inboxOffered' | 'inboxWaiting'>,
  ) => SegmentedOption[];
  readonly meter: (open: number) => StageMeterWords;
  readonly search: TranslatedText;
  readonly searchHint: TranslatedText;
  readonly clearSearch: TranslatedText;
}

/** The list top's own words, built in `@heliogrid/i18n` (`leadsListTopWords`). */
export interface LeadsListTopWords {
  /** The hero's overline — *Today · Wednesday, 11 Nov*. */
  readonly today: TranslatedText;
  readonly name: TranslatedText;
  readonly open: TranslatedText;
  readonly openSpoken: (count: number) => TranslatedText;
  readonly inbox: TranslatedText;
  readonly inboxSpoken: (count: number) => TranslatedText;
  readonly dormant: TranslatedText;
  readonly dormantSpoken: (count: number) => TranslatedText;
  readonly sortTitle: TranslatedText;
  readonly sortNamed: (order: TranslatedText) => TranslatedText;
  readonly newest: TranslatedText;
  readonly billLargest: TranslatedText;
  readonly billSmallest: TranslatedText;
  readonly lastActivity: TranslatedText;
  readonly close: TranslatedText;
  readonly stages: TranslatedText;
  readonly all: TranslatedText;
  readonly stage: (stage: LeadStage) => TranslatedText;
  readonly filters: TranslatedText;
  readonly filtersActive: (count: number) => TranslatedText;
  readonly panel: FilterPanelWords;
  readonly source: TranslatedText;
  readonly anySource: TranslatedText;
  readonly sourceWord: (source: LeadSource) => TranslatedText;
  readonly sources: readonly LeadSource[];
  readonly dormantFilter: TranslatedText;
  readonly dormantOnly: TranslatedText;
}

/**
 * **The Leads list's top** (`SCR-M02-03`, `M02-41`), both platforms: the shared `ListTop` filled
 * from the list's screen — the open leads with the inbox and the dormant beside them, whose leads,
 * the search with the order and the filters (source, dormant), and the stage chips, Won last. It
 * stays while a filter's read is out and when nothing matches, so the way back is never hidden.
 */
export interface LeadsListFilterBarProps {
  readonly screen: LeadsListFilterBarScreen;
  /** The pipeline under the chosen owner, as the last read counted it. */
  readonly pipeline: LeadsPipeline;
  /** How many leads the filters match, the filter sheet's *Show N results*. */
  readonly matching: number;
  readonly room: ListRoom;
  /** The inbox: the morning triage, a screen of its own. */
  readonly onInbox: () => void;
  readonly words: LeadsListFilterBarWords;
  readonly top: LeadsListTopWords;
}
