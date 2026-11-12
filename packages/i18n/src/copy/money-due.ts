/**
 * Money due's words (`MoneyDueWords`, `SCR-M11-01`, `M11-54`): the hero, its tiles, the groups —
 * late, due today, part paid — and each row's mark and *Remind*.
 */
import type { MoneyDueGroup } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { PAYMENTS } from './payments-screen';
import { PROJECT_DAYS } from './projects';
import { SHELL } from './shell';

type T = Translator['t'];

const MONEY_DUE = {
  groupLate: /*i18n*/ { id: 'Late' },
  groupDue: /*i18n*/ { id: 'Due today' },
  groupPart: /*i18n*/ { id: 'Part received' },
  tile: /*i18n*/ { id: '{group} · {count}' },
  lateFor: /*i18n*/ { id: '{days} late' },
  partIn: /*i18n*/ { id: 'Part in' },
  remind: /*i18n*/ { id: 'Remind' },
  remindRow: /*i18n*/ { id: 'Remind {name}' },
} satisfies Record<string, MessageRef>;

/** Money due's groups, in the person's words. */
const MONEY_DUE_GROUP_WORDS: Record<MoneyDueGroup, MessageRef> = {
  late: MONEY_DUE.groupLate,
  due: MONEY_DUE.groupDue,
  part: MONEY_DUE.groupPart,
};

/** Money due's words (`MoneyDueWords`, `SCR-M11-01`). */
export function moneyDueWords(t: T) {
  const p = PAYMENTS;
  return {
    moneyDue: t(p.moneyDue),
    toCollect: t(p.toCollect),
    collectedThisMonth: (amount: string) => t(p.collectedThisMonth, { amount }),
    dueRowLine: (number: string, part: string) => t(p.dueRowLine, { number, part }),
    days: (count: number) => t(PROJECT_DAYS, { count }),
    group: (group: MoneyDueGroup) => t(MONEY_DUE_GROUP_WORDS[group]),
    tile: (group: string, count: number) => t(MONEY_DUE.tile, { group, count }),
    lateFor: (days: string) => t(MONEY_DUE.lateFor, { days }),
    dueToday: t(MONEY_DUE.groupDue),
    partIn: t(MONEY_DUE.partIn),
    remind: t(MONEY_DUE.remind),
    remindRow: (name: string) => t(MONEY_DUE.remindRow, { name }),
    showAll: (count: number) => t(p.showAll, { count }),
    emptyTitle: t(p.moneyDueEmptyTitle),
    emptyBody: t(p.moneyDueEmptyBody),
    failedTitle: t(p.moneyDueFailed),
    failedMessage: t(p.failedMessage),
    loading: t(p.loading),
    retry: t(SHELL.tryAgain),
    open: (name: string) => t(p.openRow, { name }),
  };
}
