import type { TranslatedText } from '@heliogrid/contracts';
import type {
  LeadSource,
  LeadStage,
  LeadsListFilters,
  LeadsListSort,
  LeadsPipeline,
  LeadsWhose,
} from '@heliogrid/domain';
import type { SegmentedOption } from '../SegmentedControl/SegmentedControl.types';
import type { StageMeterForm, StageMeterWords } from '../StageMeter/StageMeter.types';

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
  /** The Bill chip: largest first, smallest first, then newest first again. */
  stepBillSort(): void;
  setQuery(query: string): void;
}

/** One choice of the source menu: any source (`null`), or one source by its word. */
export interface LeadsListSourceChoice {
  readonly key: string;
  readonly label: TranslatedText;
  readonly source: LeadSource | null;
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
  /** The chips' group name, and the tick's name on a chosen chip. */
  readonly filters: TranslatedText;
  readonly selected: TranslatedText;
  readonly dormant: TranslatedText;
  /** The Bill chip's words by the order the list is in. */
  readonly bill: (sort: LeadsListSort) => TranslatedText;
  /** The source menu's name, and its trigger's words while no source is chosen. */
  readonly source: TranslatedText;
  readonly sourceWord: (source: LeadSource) => TranslatedText;
  readonly sourceChoices: readonly LeadsListSourceChoice[];
}

/**
 * **The Leads list's filters** (`SCR-M02-03`, `M02-41`), both platforms: whose leads with the
 * inbox beside them, the pipeline meter whose stages filter, the search and the chips — Dormant
 * with its count, the bill's order, the source. They stay in view while a filter's read is out and
 * when nothing matches, so the way back is never hidden. What it reads and sets is
 * `useLeadsListScreen`'s; the screen supplies the inbox's move.
 */
export interface LeadsListFilterBarProps {
  readonly screen: LeadsListFilterBarScreen;
  /** The pipeline under the chosen owner, as the last read counted it. */
  readonly pipeline: LeadsPipeline;
  /**
   * `card`: the phone's head — whose leads, the meter's card, the search, then the chips with the
   * Bill order. `band`: over the desktop's table — the meter's band, then whose leads beside the
   * search and the chips; the table's own column orders the bill, so no Bill chip is drawn.
   */
  readonly form: StageMeterForm;
  /** The inbox segment: the morning triage, a screen of its own. */
  readonly onInbox: () => void;
  readonly words: LeadsListFilterBarWords;
}
