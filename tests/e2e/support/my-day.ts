/** My Day's sample day (`MyDay.spec.tsx`, `MyDay.story.tsx`): a salesperson's tasks in Pune. */
import type { MyDayItem } from '@heliogrid/contracts';
import type { MyDayBand } from '@heliogrid/domain';

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** A task on a lead, due `offset` ms from now — the fields My Day reads, the rest plausible. */
export interface Seed {
  readonly id: number;
  readonly name: string | null;
  readonly city: string | null;
  readonly band: MyDayBand;
  readonly offset: number;
  readonly kind?: 'follow_up' | 'site_visit' | 'call';
  readonly provenance?: 'manual' | 'call_back_window' | 'retry_after_no_answer' | 'visit_booked';
  readonly bill?: string;
  readonly canDial?: boolean;
  readonly visitPlace?: string;
}

export const NEXT: Seed = {
  id: 1,
  name: 'Sunil Mehta',
  city: 'Kothrud, Pune',
  band: 'overdue',
  offset: -2 * DAY,
  provenance: 'retry_after_no_answer',
  bill: '4200',
};
export const ASHA: Seed = {
  id: 2,
  name: 'Asha Patil',
  city: 'Baner',
  band: 'overdue',
  offset: -3 * DAY,
};
/** Do-not-call: no call is offered. */
export const KIRAN: Seed = {
  id: 3,
  name: 'Kiran Joshi',
  city: 'Aundh',
  band: 'overdue',
  offset: -6 * DAY,
  canDial: false,
};
export const MEERA: Seed = {
  id: 5,
  name: 'Meera Deshpande',
  city: 'Wakad',
  band: 'today',
  offset: 2 * HOUR,
  kind: 'site_visit',
  provenance: 'visit_booked',
  visitPlace: '14 Laxmi Complex, Baner Road, Pune',
};

export const SEEDS = {
  next: NEXT,
  overdue: [ASHA, KIRAN, { id: 4, name: null, city: null, band: 'overdue', offset: -1 * DAY }],
  today: [
    MEERA,
    { id: 6, name: 'Rahul Shinde', city: 'Hadapsar', band: 'today', offset: 3 * HOUR },
  ],
  week: [{ id: 7, name: 'Pooja Kale', city: 'Kharadi', band: 'week', offset: 3 * DAY }],
} satisfies Record<string, Seed | readonly Seed[]>;

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** The seed as the read carries it. */
export function itemOf(seed: Seed): MyDayItem {
  const now = Date.now();
  return {
    band: seed.band,
    canDial: seed.canDial ?? true,
    visitPlace: seed.visitPlace ?? null,
    task: {
      id: uuid(seed.id),
      leadId: uuid(seed.id + 500),
      kind: seed.kind ?? 'follow_up',
      title: null,
      status: 'open',
      dueAt: new Date(now + seed.offset).toISOString(),
      assignee: { userId: uuid(900), name: 'Ravi Kulkarni' },
      provenance: seed.provenance ?? 'manual',
      doneAt: null,
    },
    lead: {
      id: uuid(seed.id + 500),
      customerId: uuid(seed.id + 700),
      name: seed.name,
      phoneE164: '+919845027746',
      city: seed.city,
      segment: 'residential',
      source: 'quick_add',
      stage: 'contacted',
      state: null,
      owner: null,
      monthlyBill: seed.bill === undefined ? null : { amount: seed.bill, tier: 'assumed' },
      value: null,
      createdAt: new Date(now - 30 * DAY).toISOString(),
      lastActivityAt: new Date(now - 2 * DAY).toISOString(),
    },
  } as MyDayItem;
}
