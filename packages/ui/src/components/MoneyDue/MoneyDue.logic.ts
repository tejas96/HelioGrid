import type { MoneyDue, MoneyDueRow, TranslatedText } from '@heliogrid/contracts';
import { daysFrom, MONEY_DUE_GROUPS, type MoneyDueGroup } from '@heliogrid/domain';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type { MoneyDueProps, MoneyDueWords } from './MoneyDue.types';

/**
 * The hero's tiles: design A's late and due-today, and part received beside them when any part is
 * part paid — so the tiles always add up to the figure above them.
 */
export function tileGroupsOf(due: MoneyDue): readonly MoneyDueGroup[] {
  return MONEY_DUE_GROUPS.filter((group) => group !== 'part' || due.groups.part.count > 0);
}

/** A row's mark — glyph, word and tint (`F7-12`): how late, due today, or part in. */
export function rowMarkOf(
  row: MoneyDueRow,
  today: string,
  words: MoneyDueWords,
): { readonly tone: StatusTone; readonly label: TranslatedText } {
  switch (row.group) {
    case 'late':
      return { tone: 'danger', label: words.lateFor(words.days(daysFrom(row.dueOn, today))) };
    case 'due':
      return { tone: 'accent', label: words.dueToday };
    case 'part':
      return { tone: 'success', label: words.partIn };
  }
}

/**
 * One row as both halves draw it: who, the project and part, the mark, the press that opens its
 * payments, and *Remind* — absent for a reader who may not share the request.
 */
export function dueRowOf(row: MoneyDueRow, due: MoneyDue, props: MoneyDueProps) {
  const { words, onRemind } = props;
  const name = row.name ?? row.number;
  return {
    name,
    line: words.dueRowLine(row.number, row.label),
    mark: rowMarkOf(row, due.today, words),
    open: { name: words.open(name), onOpen: () => props.onOpen(row.projectId) },
    remind:
      onRemind === undefined || !due.canRemind
        ? null
        : {
            label: words.remind,
            spokenName: words.remindRow(name),
            onClick: () => onRemind(row.projectId, row.partId),
          },
  };
}
