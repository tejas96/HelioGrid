import type { EarlierPlan } from '@heliogrid/contracts';

/** Two plans a newer version replaced, the older one from before who and which were kept. */
export const EARLIER: readonly EarlierPlan[] = [
  {
    version: 1,
    replacedAt: '2026-11-14T10:00:00.000Z',
    replacedBy: { userId: '018f0000-0000-7000-8000-0000000000a1', name: 'Priya Kale' },
    parts: [
      {
        id: '018f0000-0000-7000-8000-000000000011',
        label: 'Advance',
        amount: '19057.50',
        dueOnStage: 'won',
      },
      {
        id: '018f0000-0000-7000-8000-000000000012',
        label: 'Material',
        amount: '171517.50',
        dueOnStage: 'dispatched',
      },
    ],
  },
  {
    version: null,
    replacedAt: '2026-11-10T10:00:00.000Z',
    replacedBy: null,
    parts: [
      {
        id: '018f0000-0000-7000-8000-000000000013',
        label: 'Whole',
        amount: '190575.00',
        dueOnStage: 'won',
      },
    ],
  },
];
