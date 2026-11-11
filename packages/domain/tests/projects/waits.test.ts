import { describe, expect, it } from 'vitest';
import type { ProjectStanding } from '../../src/projects/machine';
import type { ProjectStage } from '../../src/projects/stages';
import {
  daysFrom,
  decideNotNeeded,
  decideWaitEnd,
  decideWaitStart,
  type HandoverRow,
  rowsWaitingForHandover,
} from '../../src/projects/waits';

function at(stage: ProjectStage): ProjectStanding {
  return { stage, incentiveApplies: true };
}

const TODAY = '2026-11-10';

describe('daysFrom — whole company days between two (M08-11)', () => {
  it.each([
    ['2026-11-10', '2026-11-10', 0],
    ['2026-11-10', '2026-11-11', 1],
    ['2026-10-31', '2026-11-01', 1],
    ['2026-12-31', '2027-01-01', 1],
    ['2028-02-28', '2028-03-01', 2],
    ['2026-01-31', '2026-03-01', 29],
    ['2026-11-11', '2026-11-10', 0],
    ['not-a-day', '2026-11-10', 0],
  ] as const)('from %s to %s is %i days', (from, to, days) => {
    expect(daysFrom(from, to)).toBe(days);
  });
});

describe('decideWaitStart — one open wait, a reason of its party, never a day ahead (M08-21)', () => {
  it.each([
    ['handed_over', true, 'customer', 'crew_availability', '2026-11-11', 'project_closed'],
    ['cancelled', false, 'customer', 'site_access', TODAY, 'project_closed'],
    ['dispatched', true, 'customer', 'crew_availability', '2026-11-11', 'wait_open'],
    ['dispatched', false, 'customer', 'crew_availability', '2026-11-11', 'reason_not_of_party'],
    ['dispatched', false, 'utility', 'material_supply', TODAY, 'reason_not_of_party'],
    ['dispatched', false, 'customer', 'site_access', '2026-11-11', 'date_in_future'],
    ['dispatched', false, 'customer', 'site_access', TODAY, null],
    ['dispatched', false, 'customer', 'site_access', '2026-11-09', null],
    ['won', false, 'material', 'other', TODAY, null],
  ] as const)(
    'at %s (a wait open: %s), %s for %s from %s is refused for %s',
    (stage, hasOpenWait, party, reason, startedOn, refusal) => {
      expect(decideWaitStart(at(stage), { party, reason, startedOn }, hasOpenWait, TODAY)).toBe(
        refusal,
      );
    },
  );
});

describe('decideWaitEnd — a person ends only an open wait', () => {
  it.each([
    [true, null],
    [false, 'no_open_wait'],
  ] as const)('with a wait open: %s, ending it is refused for %s', (hasOpenWait, refusal) => {
    expect(decideWaitEnd(hasOpenWait)).toBe(refusal);
  });
});

describe('decideNotNeeded — takes its reason in the person’s words (M08-31)', () => {
  it.each([
    ['dispatched', 'Rooftop already has a meter', null],
    ['dispatched', 'x', null],
    ['dispatched', '', 'reason_needed'],
    ['dispatched', '   ', 'reason_needed'],
    ['dispatched', '\t\n', 'reason_needed'],
    ['dispatched', ' ', 'reason_needed'],
    ['handed_over', 'Rooftop already has a meter', 'project_closed'],
    ['cancelled', '', 'project_closed'],
  ] as const)('at %s, %j is refused for %s', (stage, reason, refusal) => {
    expect(decideNotNeeded(at(stage), reason)).toBe(refusal);
  });
});

describe('rowsWaitingForHandover — every pending row but the one handover makes (M08-32)', () => {
  it.each([
    ['pending', null, ['row']],
    ['pending', 'payments', ['row']],
    ['pending', 'handover', []],
    ['done', null, []],
    ['not_needed', null, []],
  ] as const)('a %s row made by %j holds handover back: %j', (state, madeBy, waiting) => {
    expect(rowsWaitingForHandover([{ row: 'row', state, madeBy }])).toEqual(waiting);
  });

  it('keeps the checklist’s order, and none waits on an empty one', () => {
    const rows: HandoverRow[] = [
      { row: 'net_metering_application', state: 'pending', madeBy: null },
      { row: 'utility_approval', state: 'done', madeBy: null },
      { row: 'warranty_documents', state: 'pending', madeBy: null },
      { row: 'handover_pack', state: 'pending', madeBy: 'handover' },
    ];
    expect(rowsWaitingForHandover(rows)).toEqual([
      'net_metering_application',
      'warranty_documents',
    ]);
    expect(rowsWaitingForHandover([])).toEqual([]);
  });
});
