import type { MoneyDue, MoneyDueRow } from '@heliogrid/contracts';
import {
  type CalendarDate,
  localDate,
  type MarketPack,
  MONEY_DUE_GROUPS,
  type MoneyDueGroup,
  minorUnits,
  moneyDueGroupOf,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, projectNumberOf, sumMinorUnits } from '@heliogrid/domain/server';
import type { OwingProject } from '../projects.payments-read.repository';
import { type MoneyFormat, stoodPartsOf } from './money';

/**
 * Money due (`SCR-M11-01`, `M11-54`): every part due and not fully paid — late first, then due
 * today, then part paid (`moneyDueGroupOf`), each longest waiting first — with the one total to
 * collect and each group's tile. The list is every unpaid part the reader may see — or one group's
 * alone — paged here; the tiles always count every group.
 */
export function moneyDueOf(
  owing: { readonly projects: readonly OwingProject[]; readonly collectedMinor: number },
  pack: MarketPack,
  timeZone: string,
  today: CalendarDate,
  page: { readonly page: number; readonly limit: number; readonly group?: MoneyDueGroup },
  canRemind: boolean,
): MoneyDue {
  const format: MoneyFormat = {
    currency: pack.formats.currency,
    digits: pack.formats.minorUnitDigits,
    timeZone,
  };
  const decimal = (amount: number) => minorUnitsToDecimal(minorUnits(amount), format.digits);
  const due = owing.projects
    .flatMap((owner) =>
      stoodPartsOf(owner.parts)
        .filter((part) => part.due && part.standing.outstanding > 0)
        .map((part) => {
          const dueOn = localDate(part.facts.dueSince ?? 0, timeZone);
          return { owner, part, dueOn, group: moneyDueGroupOf(part.standing.state, dueOn, today) };
        }),
    )
    .sort(
      (a, b) =>
        GROUP_ORDER[a.group] - GROUP_ORDER[b.group] ||
        (a.part.facts.dueSince ?? 0) - (b.part.facts.dueSince ?? 0) ||
        a.part.facts.id.localeCompare(b.part.facts.id),
    );
  const rows: MoneyDueRow[] = due.map(({ owner, part, dueOn, group }) => ({
    projectId: owner.projectId,
    number: projectNumberOf(owner.number),
    name: owner.name,
    partId: part.facts.id,
    label: part.facts.label,
    state: part.standing.state,
    outstanding: decimal(part.standing.outstanding),
    dueOn,
    group,
  }));
  const tile = (group: MoneyDueGroup) => {
    const inGroup = due.filter((one) => one.group === group);
    return {
      count: inGroup.length,
      amount: decimal(sumMinorUnits(inGroup.map(({ part }) => part.standing.outstanding))),
    };
  };
  const offset = (page.page - 1) * page.limit;
  const listed = page.group === undefined ? rows : rows.filter((row) => row.group === page.group);
  return {
    today,
    currencyCode: format.currency,
    toCollect: decimal(sumMinorUnits(due.map(({ part }) => part.standing.outstanding))),
    groups: { late: tile('late'), due: tile('due'), part: tile('part') },
    collectedThisMonth: decimal(owing.collectedMinor),
    rows: {
      items: listed.slice(offset, offset + page.limit),
      totalCount: listed.length,
    },
    canRemind,
  };
}

/** Late first, then due today, then part paid: the order the groups are read in. */
const GROUP_ORDER = Object.fromEntries(MONEY_DUE_GROUPS.map((group, at) => [group, at])) as Record<
  MoneyDueGroup,
  number
>;
