import type { CollectionsSettings, MoneyDue } from '@heliogrid/contracts';
import { TODAY } from './projects-fixtures';

/** Money due and the collections settings as the origin keeps them (`payments-origin.ts`). */

const id = (n: number) => `01a60000-0000-7000-8000-${String(n).padStart(12, '0')}`;

/** Money due with this many parts late, due today and part paid, every row on the one page. */
export function moneyDueOf(late: number, due: number, part: number): MoneyDue {
  const counts = { late, due, part } as const;
  const groups = (['late', 'due', 'part'] as const).flatMap((group) =>
    Array.from({ length: counts[group] }, () => group),
  );
  const row = (group: (typeof groups)[number], n: number) => ({
    projectId: id(700 + n),
    number: `PRJ-${String(n).padStart(4, '0')}`,
    name: null,
    partId: id(800 + n),
    label: 'Booking',
    state: group === 'part' ? 'part_received' : 'due',
    outstanding: '1000.00',
    dueOn: TODAY,
    group,
  });
  const tile = (count: number) => ({ count, amount: `${count * 1000}.00` });
  return {
    today: TODAY,
    currencyCode: 'INR',
    toCollect: `${groups.length * 1000}.00`,
    groups: { late: tile(late), due: tile(due), part: tile(part) },
    collectedThisMonth: '0.00',
    rows: {
      items: groups.map((group, n) => row(group, n)),
      totalCount: groups.length,
    },
    canRemind: true,
  } as MoneyDue;
}

export function collections(upiId: string | null): CollectionsSettings {
  return {
    payTo: { upiId, payee: 'Sun EPC', bank: null, upiLimit: '100000.00' },
    testUri: upiId === null ? null : `upi://pay?pa=${upiId}&am=1.00`,
    canEdit: true,
    modes: ['upi', 'neft', 'cash'],
    lastSaved: null,
  };
}
