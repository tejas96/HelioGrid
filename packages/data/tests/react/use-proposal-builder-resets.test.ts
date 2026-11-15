// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bodies, mounted, readyOf, stepOf } from './proposal-builder-mounted';
import { PROPOSAL, proposalDetail } from './proposals-fixtures';
import { sell } from './proposals-origin';
import { originActs } from './proposals-origin-acts';

/**
 * The builder's two ways back (`T-M06-008`, `T-M06-006`) through the real client: step 6's *Reset to
 * company timeline* puts the company's template back over a rep's edit, and step 4's ↺ puts the
 * filled figures back over the person's own months, labelled `estimated` as the server answers them.
 */

const COMPANY_TIMELINE = [
  { name: 'Site visit', description: 'We measure your roof.' },
  { name: 'Install', description: 'Two days on site.' },
];
const FILLED = [354, 372, 438, 450, 456, 354, 288, 294, 336, 378, 348, 336];
const TYPED = [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300];

describe('step 6 — Reset puts the company’s timeline back (T-M06-008)', () => {
  it('a rep’s own steps give way to the company’s template in force', async () => {
    const draft = proposalDetail({});
    draft.document.fields.timeline = [
      { name: 'Only here', description: 'For this customer.', durationDays: 3 },
    ];
    sell.proposal = draft;
    originActs.companyTimeline = COMPANY_TIMELINE;
    const { view } = await mounted('timeline');

    act(() => stepOf(view.result.current, 'timeline').onReset());

    await waitFor(() =>
      expect(stepOf(view.result.current, 'timeline').phases).toEqual(
        COMPANY_TIMELINE.map((phase) => ({ ...phase, durationDays: null })),
      ),
    );
    expect(sell.sent.map((write) => write.path)).toEqual([`/proposals/${PROPOSAL}/reset`]);
    expect(bodies()[0]).toMatchObject({ step: 'timeline', revision: 0 });
  });
});

describe('step 4 — ↺ puts the filled figures back after an edit (T-M06-006)', () => {
  it('the person’s own months give way to the source’s, labelled estimated', async () => {
    const draft = proposalDetail({});
    const source = { kind: 'record' as const, databases: ['ERA5' as const] };
    draft.document.fields.performance = {
      ...draft.document.fields.performance,
      source,
      grain: 'district',
      editedMonthlyKwh: TYPED,
      editedAtCapacityKw: 3,
    };
    draft.document.generation = {
      monthlyKwh: TYPED,
      yearlyKwh: 3600,
      bestMonth: 0,
      source,
      grain: 'district',
      tier: 'assumed',
      capacityChangedSinceEdit: false,
    };
    sell.proposal = draft;
    originActs.filledMonths = FILLED;
    const { view } = await mounted('performance');
    expect(stepOf(view.result.current, 'performance').monthlyKwh).toEqual(TYPED);

    act(() => stepOf(view.result.current, 'performance').onRefill());

    await waitFor(() =>
      expect(stepOf(view.result.current, 'performance').monthlyKwh).toEqual(FILLED),
    );
    expect(sell.sent.map((write) => write.path)).toEqual([`/proposals/${PROPOSAL}/energy`]);
    expect(bodies()[0]).toMatchObject({ mode: 'reset' });
    expect(stepOf(view.result.current, 'performance').fill).toBe('source');
    expect(readyOf(view.result.current).frame.snapshot?.generation?.monthlyKwh).toEqual(FILLED);
    expect(view.result.current.pageFacts?.generationTier).toBe('estimated');
  });
});
