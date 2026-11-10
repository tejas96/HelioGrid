import { describe, expect, it } from 'vitest';
import {
  activityRecorded,
  advanceStage,
  assign,
  callAnswered,
  markQualified,
  visitBooked,
} from '../../src/crm/lifecycle';
import { disqualify, junk, markLost, reopen } from '../../src/crm/lifecycle-close';
import type { LeadActResult, LeadLifecycle } from '../../src/crm/lifecycle-model';
import { flagDormant, snooze } from '../../src/crm/lifecycle-parking';
import { LEAD_STAGES, type LeadStage } from '../../src/crm/vocabulary';
import { CLOSED_BY_PRIYA, CONTEXT, leadAt, nextOf, refusalOf } from './lead-fixture';

/** Every parking and terminal act a lead at any open state can take. */
const PARKING_ACTS: readonly [string, (lead: LeadLifecycle) => LeadActResult][] = [
  ['snooze', (lead) => snooze(lead, '2026-11-20', CONTEXT.today)],
  ['flag dormant', flagDormant],
  ['disqualify', (lead) => disqualify(lead, 'budget', CONTEXT)],
  ['junk', (lead) => junk(lead, CONTEXT)],
  ['mark lost', (lead) => markLost(lead, { reason: 'price' }, CONTEXT)],
];

describe('the funnel and R9 are two machines (M02-41, M02-49)', () => {
  it('the funnel runs new to won and no parking state moves the stage', () => {
    const steps: readonly ((lead: LeadLifecycle) => LeadActResult)[] = [
      callAnswered,
      markQualified,
      visitBooked,
      (lead) => advanceStage(lead, 'design'),
      (lead) => advanceStage(lead, 'proposal'),
      (lead) => advanceStage(lead, 'negotiating'),
      (lead) => advanceStage(lead, 'won'),
    ];
    let lead = leadAt({});
    const walked: LeadStage[] = [lead.stage];
    for (const step of steps) {
      const result = step(lead);
      lead = nextOf(result);
      walked.push(lead.stage);
      expect(result.kind === 'moved' && result.transitions.map((t) => t.moveKind)).toEqual([
        'funnel_stage',
      ]);
    }
    expect(walked).toEqual(LEAD_STAGES);

    const parked = LEAD_STAGES.flatMap((stage) =>
      PARKING_ACTS.map(([act, park]) => ({ stage, act, result: park(leadAt({ stage })) })),
    );
    for (const { stage, result } of parked) {
      if (result.kind === 'refused') continue;
      expect(result.next.stage).toBe(stage);
      expect(result.transitions.every((t) => t.moveKind === 'lifecycle_state')).toBe(true);
    }
    /* Only a won lead is past dormancy — every other act parked every stage. */
    expect(
      parked
        .filter(({ result }) => result.kind === 'refused')
        .map(({ stage, act }) => [stage, act]),
    ).toEqual([['won', 'flag dormant']]);
  });
});

describe('a close needs its reason and a reopen keeps it (M02-53, M02-56)', () => {
  it.each([null, '', 'price', 'Renting', ' budget', 'junk'])(
    'disqualify without one of the six reasons is refused — %j',
    (reason) => {
      expect(refusalOf(disqualify(leadAt({ stage: 'contacted' }), reason, CONTEXT))).toBe(
        'reason_not_listed',
      );
    },
  );

  it('reopen from disqualified returns the prior stage with the close kept', () => {
    const closed = nextOf(disqualify(leadAt({ stage: 'qualified' }), 'renting', CONTEXT));
    const result = reopen(closed);
    expect(result).toEqual({
      kind: 'moved',
      next: {
        ...closed,
        stage: 'qualified',
        state: null,
        reopenCount: 1,
        close: { state: 'disqualified', reason: 'renting', ...CLOSED_BY_PRIYA },
      },
      transitions: [
        { moveKind: 'lifecycle_state', from: 'disqualified', to: null, cause: 'reopen' },
      ],
      raisesTask: null,
    });
  });
});

describe('advanceStage — forward only, never on a closed lead', () => {
  it.each([
    ['new', 'contacted', null],
    ['new', 'won', null],
    ['qualified', 'survey', null],
    ['contacted', 'contacted', 'stage_reached'],
    ['qualified', 'contacted', 'stage_reached'],
    ['won', 'negotiating', 'stage_reached'],
  ] as const)('%s → %s is refused for %s', (from, to, refusal) => {
    const result = advanceStage(leadAt({ stage: from }), to);
    expect(refusalOf(result)).toBe(refusal);
    if (refusal === null) expect(nextOf(result).stage).toBe(to);
  });

  it.each(['disqualified', 'lost', 'junk'] as const)('a %s lead takes no stage move', (state) => {
    expect(refusalOf(advanceStage(leadAt({ state }), 'contacted'))).toBe('lead_closed');
  });

  it('a snoozed lead moves its stage and stays snoozed — the two are orthogonal', () => {
    const next = nextOf(advanceStage(leadAt({ state: 'snoozed', wakeOn: '2026-11-20' }), 'survey'));
    expect(next).toMatchObject({ stage: 'survey', state: 'snoozed', wakeOn: '2026-11-20' });
  });

  it('a dormant lead returns to work first, then moves its stage', () => {
    const result = advanceStage(leadAt({ state: 'dormant' }), 'qualified', 'automation');
    expect(result).toMatchObject({
      next: { stage: 'qualified', state: null },
      transitions: [
        { moveKind: 'lifecycle_state', from: 'dormant', to: null, cause: 'automation' },
        { moveKind: 'funnel_stage', from: 'new', to: 'qualified', cause: 'automation' },
      ],
    });
  });
});

describe('assign — ownership is its own fact (M02-30, M02-50)', () => {
  it('an unassigned lead enters Assigned at new, and no transition is written', () => {
    const result = assign(leadAt({ ownerId: null }), 'rajesh');
    expect(result).toMatchObject({ next: { ownerId: 'rajesh', stage: 'new' }, transitions: [] });
  });

  it('a reassignment keeps the stage and the state the work reached', () => {
    const lead = leadAt({ stage: 'survey', state: 'snoozed', wakeOn: '2026-11-20' });
    expect(nextOf(assign(lead, 'anita'))).toEqual({ ...lead, ownerId: 'anita' });
  });

  it('assigning a lead to its owner is refused', () => {
    expect(refusalOf(assign(leadAt({}), 'rajesh'))).toBe('already_owner');
  });

  it('a closed lead takes no owner until a reopen', () => {
    const binned = nextOf(junk(leadAt({ ownerId: null }), CONTEXT));
    expect(refusalOf(assign(binned, 'rajesh'))).toBe('lead_closed');
    expect(refusalOf(assign(nextOf(reopen(binned)), 'rajesh'))).toBeNull();
  });
});

describe('callAnswered — a record of what happened, never refused', () => {
  it.each([
    ['new', null, 'contacted', null],
    ['contacted', null, 'contacted', null],
    ['survey', null, 'survey', null],
    ['new', 'snoozed', 'contacted', 'snoozed'],
    ['qualified', 'dormant', 'qualified', null],
    ['new', 'junk', 'new', 'junk'],
    ['new', 'disqualified', 'new', 'disqualified'],
  ] as const)('%s and %s → %s and %s', (stage, state, nextStage, nextState) => {
    expect(nextOf(callAnswered(leadAt({ stage, state })))).toMatchObject({
      stage: nextStage,
      state: nextState,
    });
  });
});

describe('markQualified — a person decides, from new or contacted only (M02-45)', () => {
  it.each([
    ['new', null, null],
    ['contacted', null, null],
    ['contacted', 'dormant', null],
    ['qualified', null, 'stage_reached'],
    ['survey', null, 'stage_reached'],
    ['won', null, 'stage_reached'],
    ['contacted', 'lost', 'lead_closed'],
  ] as const)('%s and %s is refused for %s', (stage, state, refusal) => {
    expect(refusalOf(markQualified(leadAt({ stage, state })))).toBe(refusal);
  });
});

describe('visitBooked — moves a lead before survey to survey (M02-46)', () => {
  it.each([
    ['new', 'survey'],
    ['qualified', 'survey'],
    ['survey', 'survey'],
    ['design', 'design'],
  ] as const)('a lead at %s is at %s after a booking', (stage, after) => {
    expect(nextOf(visitBooked(leadAt({ stage }))).stage).toBe(after);
  });

  it('a second booking on a dormant survey lead returns it with no stage move', () => {
    expect(visitBooked(leadAt({ stage: 'survey', state: 'dormant' }))).toMatchObject({
      next: { stage: 'survey', state: null },
      transitions: [{ moveKind: 'lifecycle_state', from: 'dormant', to: null }],
    });
  });

  it('a closed lead takes no booking', () => {
    expect(refusalOf(visitBooked(leadAt({ state: 'lost' })))).toBe('lead_closed');
  });
});

describe('activityRecorded — any activity returns a dormant lead (M02-52)', () => {
  it.each([
    ['dormant', null, 1],
    [null, null, 0],
    ['snoozed', 'snoozed', 0],
    ['junk', 'junk', 0],
  ] as const)('a %s lead is %s after it, with %i moves', (state, after, moves) => {
    const result = activityRecorded(leadAt({ stage: 'qualified', state }));
    expect(result).toMatchObject({ next: { stage: 'qualified', state: after } });
    expect(result.kind === 'moved' && result.transitions.length).toBe(moves);
  });
});
