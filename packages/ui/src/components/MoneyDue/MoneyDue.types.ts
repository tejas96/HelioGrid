import type { MoneyDue, MoneyDueRow, TranslatedText } from '@heliogrid/contracts';
import type { MoneyDueGroup, MoneyDueGroupView, Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';

/**
 * Money due (`SCR-M11-01`, `M11-54`, design A): the one total to collect in the hero with the late
 * and due-today tiles and what came in this month, then the parts grouped — late, due today, part
 * paid — each longest waiting first and showing its first few until *Show all*. Late from the day
 * after a part fell due, no grace and no threshold. A row opens its project's payments; *Remind*
 * opens the part's request, for who may share it.
 */
export interface MoneyDueWords {
  readonly moneyDue: TranslatedText;
  readonly toCollect: TranslatedText;
  readonly collectedThisMonth: (amount: string) => TranslatedText;
  readonly dueRowLine: (number: string, part: string) => TranslatedText;
  readonly days: (count: number) => TranslatedText;
  /** A group's name: *Late*, *Due today*, *Part received*. */
  readonly group: (group: MoneyDueGroup) => TranslatedText;
  /** A tile's label: the group and how many wait in it. */
  readonly tile: (group: TranslatedText, count: number) => TranslatedText;
  /** A row's mark: how late, due today, or part in. */
  readonly lateFor: (days: TranslatedText) => TranslatedText;
  readonly dueToday: TranslatedText;
  readonly partIn: TranslatedText;
  readonly remind: TranslatedText;
  readonly remindRow: (name: string) => TranslatedText;
  readonly showAll: (count: number) => TranslatedText;
  readonly emptyTitle: TranslatedText;
  readonly emptyBody: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly loading: TranslatedText;
  readonly retry: TranslatedText;
  readonly open: (name: string) => TranslatedText;
}

export interface MoneyDueProps {
  readonly read: Exclude<Read<MoneyDue>, { readonly kind: 'empty' }>;
  readonly words: MoneyDueWords;
  readonly groups: readonly MoneyDueGroupView<MoneyDueRow>[];
  readonly onShowAll: (group: MoneyDueGroup) => void;
  readonly onOpen: (projectId: string) => void;
  /** Open the part's request to send again; absent for a reader who may not share it. */
  readonly onRemind?: (projectId: string, partId: string) => void;
  readonly focusAfter: FocusAfter;
  /**
   * Where the figures stand. `hero` (Finance's home, the default): the total to collect, the late
   * and due-today tiles and this month's collected, in the screen's one hero. `none` (a home whose
   * dashboard already holds the cash — the owner's): the groups only, under a plain *Money due*
   * head, so no second hero repeats the figures above it.
   */
  readonly figures?: 'hero' | 'none';
}
