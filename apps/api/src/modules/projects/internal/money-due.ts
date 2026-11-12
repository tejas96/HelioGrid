import type { MoneyDue, MoneyDueRow } from '@heliogrid/contracts';
import { type CalendarDate, localDate, type MarketPack, minorUnits } from '@heliogrid/domain';
import { minorUnitsToDecimal, projectNumberOf, sumMinorUnits } from '@heliogrid/domain/server';
import type { OwingProject } from '../projects.payments-read.repository';
import { type MoneyFormat, stoodPartsOf } from './money';

/**
 * Money due (`SCR-M11-01`, `M11-54`): every part due and not fully paid, longest waiting first —
 * overdue from the day it fell due, with no grace and no threshold — and the one total to collect.
 * The list is every unpaid part the reader may see, paged here.
 */
export function moneyDueOf(
  owing: { readonly projects: readonly OwingProject[]; readonly collectedMinor: number },
  pack: MarketPack,
  timeZone: string,
  today: CalendarDate,
  page: { readonly page: number; readonly limit: number },
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
        .map((part) => ({ owner, part })),
    )
    .sort(
      (a, b) =>
        (a.part.facts.dueSince ?? 0) - (b.part.facts.dueSince ?? 0) ||
        a.part.facts.id.localeCompare(b.part.facts.id),
    );
  const rows: MoneyDueRow[] = due.map(({ owner, part }) => ({
    projectId: owner.projectId,
    number: projectNumberOf(owner.number),
    name: owner.name,
    partId: part.facts.id,
    label: part.facts.label,
    state: part.standing.state,
    outstanding: decimal(part.standing.outstanding),
    dueOn: localDate(part.facts.dueSince ?? 0, timeZone),
  }));
  const offset = (page.page - 1) * page.limit;
  return {
    today,
    currencyCode: format.currency,
    toCollect: decimal(sumMinorUnits(due.map(({ part }) => part.standing.outstanding))),
    collectedThisMonth: decimal(owing.collectedMinor),
    rows: {
      items: rows.slice(offset, offset + page.limit),
      totalCount: rows.length,
    },
  };
}
