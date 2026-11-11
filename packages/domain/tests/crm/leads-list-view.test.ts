import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import {
  LEADS_LIST_FIRST_SORT,
  LEADS_LIST_ORDERS,
  type LeadsListFilters,
  type LeadsListLead,
  type LeadsWhose,
  leadBillShownOf,
  leadRowNextOf,
  leadsInboxOffered,
  leadsListAskOf,
  leadsListFiltersFor,
  leadsListViewOf,
  leadsOrderKey,
  leadsPipelineOf,
  leadsSheetFiltersOn,
  leadsWhoseOf,
} from '../../src/crm/leads-list-view';
import { IN_FORMATS } from '../../src/format/pack';

const NOW = Date.parse('2026-11-10T06:00:00Z');
const DAY = 86_400_000;

function aLead(facts: Partial<LeadsListLead> = {}): LeadsListLead {
  return {
    id: 'lead-1',
    state: null,
    wakeOn: null,
    unansweredCalls: 0,
    nextTask: null,
    lastActivityAt: new Date(NOW - DAY).toISOString(),
    ...facts,
  };
}

const ALL_WHOSE: readonly LeadsWhose[] = ['mine', 'all'];
const OPENING = leadsListFiltersFor(ALL_WHOSE);
const filtered = (change: Partial<LeadsListFilters>): LeadsListFilters => ({
  ...OPENING,
  ...change,
});

describe('whose leads the list offers (F2-12…F2-14)', () => {
  it.each<[readonly RolePreset[], readonly LeadsWhose[], boolean]>([
    [['epc_owner'], ['mine', 'all'], true],
    [['sales_manager'], ['mine', 'team'], true],
    [['sales_executive'], ['mine'], false],
    [['marketing'], ['mine'], false],
    [['survey_engineer'], ['mine'], false],
    [['sales_executive', 'sales_manager'], ['mine', 'team'], true],
  ])('%j chooses %j, the inbox beside it: %s', (roles, whose, inbox) => {
    expect(leadsWhoseOf(roles)).toEqual(whose);
    expect(leadsInboxOffered(roles)).toBe(inbox);
  });

  it('the list opens on the widest choice, newest first, nothing filtered', () => {
    expect(leadsListFiltersFor(['mine', 'team'])).toEqual({
      whose: 'team',
      stage: null,
      dormant: false,
      source: null,
      sort: LEADS_LIST_FIRST_SORT,
      query: '',
    });
    expect(leadsListFiltersFor(['mine']).whose).toBe('mine');
  });
});

describe('the read the filters ask for', () => {
  it.each<[string, LeadsListFilters, readonly LeadsWhose[], object]>([
    ['nothing filtered', OPENING, ALL_WHOSE, { sort: 'created_at', order: 'desc' }],
    [
      'mine under a wider choice names the reader as owner',
      filtered({ whose: 'mine' }),
      ALL_WHOSE,
      { ownerId: 'me', sort: 'created_at', order: 'desc' },
    ],
    [
      'mine as the one choice is the whole scope',
      filtered({ whose: 'mine' }),
      ['mine'],
      { sort: 'created_at', order: 'desc' },
    ],
    [
      'stage, dormant, source, a trimmed query and the bill largest first',
      filtered({
        stage: 'qualified',
        dormant: true,
        source: 'referral',
        query: '  Nashik ',
        sort: { key: 'monthly_bill', order: 'desc' },
      }),
      ALL_WHOSE,
      {
        stage: 'qualified',
        state: 'dormant',
        source: 'referral',
        q: 'Nashik',
        sort: 'monthly_bill',
        order: 'desc',
      },
    ],
    ['a blank query asks nothing', filtered({ query: '   ' }), ALL_WHOSE, {}],
  ])('%s', (_, filters, whose, ask) => {
    expect(leadsListAskOf(filters, 'me', whose)).toEqual(
      expect.objectContaining({ sort: filters.sort.key, order: filters.sort.order, ...ask }),
    );
    if (filters.query.trim() === '')
      expect(leadsListAskOf(filters, 'me', whose)).not.toHaveProperty('q');
  });

  it('offers newest first, the bill both ways and the latest activity, each with its own key', () => {
    expect(LEADS_LIST_ORDERS.map(leadsOrderKey)).toEqual([
      'created_at:desc',
      'monthly_bill:desc',
      'monthly_bill:asc',
      'last_activity:desc',
    ]);
  });

  it.each<[Partial<LeadsListFilters>, number]>([
    [{}, 0],
    [{ dormant: true }, 1],
    [{ source: 'referral' }, 1],
    [{ dormant: true, source: 'import' }, 2],
    [{ stage: 'survey', query: 'pune' }, 0],
  ])('the filter sheet counts %j as %i on', (set, on) => {
    expect(leadsSheetFiltersOn({ ...leadsListFiltersFor(['all']), ...set })).toBe(on);
  });
});

describe('a row’s monthly bill in the tenant’s money (M02-40, F3-20)', () => {
  it.each<[string, string]>([
    ['4200.00', '₹4,200'],
    ['123456.00', '₹1,23,456'],
    ['12345678.00', '₹1,23,45,678'],
    ['0.00', '₹0'],
  ])('the wire’s %s reads %s, grouped in lakh and crore', (amount, shown) => {
    expect(leadBillShownOf({ amount }, IN_FORMATS)).toBe(shown);
  });

  it('a lead whose bill is unknown shows no figure', () => {
    expect(leadBillShownOf(null, IN_FORMATS)).toBeNull();
  });
});

describe('the pipeline meter', () => {
  it('draws every open stage in funnel order, a missing one as 0, and won never — not even in the open count', () => {
    const pipeline = leadsPipelineOf({
      byStage: [
        { stage: 'qualified', count: 12 },
        { stage: 'new', count: 6 },
        { stage: 'won', count: 2 },
      ],
      dormant: 9,
    });
    expect(pipeline.stages.map((one) => [one.stage, one.count])).toEqual([
      ['new', 6],
      ['contacted', 0],
      ['qualified', 12],
      ['survey', 0],
      ['design', 0],
      ['proposal', 0],
      ['negotiating', 0],
    ]);
    expect(pipeline).toMatchObject({ open: 18, won: 2, dormant: 9 });
  });
});

describe('what a row says comes next', () => {
  const due = (hoursFromNow: number) => new Date(NOW + hoursFromNow * 3_600_000).toISOString();
  it.each<[string, Partial<LeadsListLead>, object]>([
    [
      'snoozed, with its wake day',
      { state: 'snoozed', wakeOn: '2026-11-12', unansweredCalls: 2 },
      { kind: 'snoozed', wakeOn: '2026-11-12' },
    ],
    [
      'dormant, with its quiet days',
      { state: 'dormant', lastActivityAt: new Date(NOW - 34 * DAY - 5).toISOString() },
      { kind: 'dormant', quietDays: 34 },
    ],
    [
      'the failed tries before the retry task',
      { unansweredCalls: 2, nextTask: { kind: 'call', title: null, dueAt: due(2) } },
      { kind: 'tries', count: 2 },
    ],
    [
      'the soonest open task',
      { nextTask: { kind: 'call', title: null, dueAt: due(2) } },
      { kind: 'task', task: 'call', dueAt: due(2), overdue: false },
    ],
    [
      'a task past its moment, overdue',
      { nextTask: { kind: 'follow_up', title: null, dueAt: due(-1) } },
      { kind: 'task', task: 'follow_up', overdue: true },
    ],
    ['nothing', {}, { kind: 'none' }],
  ])('%s', (_, facts, next) => {
    expect(leadRowNextOf(aLead(facts), NOW)).toMatchObject(next);
  });
});

describe('the list for one read', () => {
  const pipeline = leadsPipelineOf({ byStage: [{ stage: 'new', count: 3 }], dormant: 0 });
  const empty = leadsPipelineOf({ byStage: [], dormant: 0 });

  it('a company with no lead and nothing narrowing is the first run', () => {
    expect(leadsListViewOf([], { matching: 0, pipeline: empty }, OPENING, ALL_WHOSE, NOW)).toBe(
      null,
    );
  });

  it.each<[string, LeadsListFilters, number, boolean]>([
    ['a filter that matches nothing', filtered({ stage: 'survey' }), 1, true],
    ['Mine under a wider choice', filtered({ whose: 'mine' }), 0, true],
  ])('%s keeps the chips and offers Clear filters', (_, filters, filtersOn, clearable) => {
    const view = leadsListViewOf([], { matching: 0, pipeline }, filters, ALL_WHOSE, NOW);
    expect(view).toMatchObject({ noMatch: true, filtersOn, clearable, rows: [] });
  });

  it('only dormant leads left is no match, never the first run', () => {
    const quiet = leadsPipelineOf({ byStage: [], dormant: 4 });
    const view = leadsListViewOf([], { matching: 0, pipeline: quiet }, OPENING, ALL_WHOSE, NOW);
    expect(view).toMatchObject({ noMatch: true, clearable: false });
  });

  it('counts what Show more brings and when each row was last touched', () => {
    const view = leadsListViewOf([aLead()], { matching: 21, pipeline }, OPENING, ALL_WHOSE, NOW);
    expect(view).toMatchObject({ unread: 20, noMatch: false, filtersOn: 0 });
    expect(view?.rows[0]).toMatchObject({ sinceActivityMs: DAY, next: { kind: 'none' } });
  });
});
