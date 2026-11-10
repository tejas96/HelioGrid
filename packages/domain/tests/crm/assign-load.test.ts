import { describe, expect, it } from 'vitest';
import { isOpenLead, type LoadLead, type LoadTask, memberLoads } from '../../src/crm/assign-load';

const NOW = Date.parse('2026-11-09T03:00:00Z');

describe('isOpenLead — owned, not parked, not closed, not won (M02-28)', () => {
  it.each<[LoadLead, boolean]>([
    [{ ownerId: 'rajesh', stage: 'new', state: null }, true],
    [{ ownerId: 'rajesh', stage: 'negotiating', state: null }, true],
    [{ ownerId: null, stage: 'new', state: null }, false],
    [{ ownerId: 'rajesh', stage: 'won', state: null }, false],
    [{ ownerId: 'rajesh', stage: 'contacted', state: 'snoozed' }, false],
    [{ ownerId: 'rajesh', stage: 'contacted', state: 'dormant' }, false],
    [{ ownerId: 'rajesh', stage: 'contacted', state: 'lost' }, false],
    [{ ownerId: 'rajesh', stage: 'contacted', state: 'junk' }, false],
  ])('%j is open: %s', (lead, open) => {
    expect(isOpenLead(lead)).toBe(open);
  });
});

describe('memberLoads — the picker’s open and overdue counts', () => {
  it('counts each member’s own rows, zero for none, and nothing for a member not listed', () => {
    const leads: LoadLead[] = [
      { ownerId: 'rajesh', stage: 'new', state: null },
      { ownerId: 'rajesh', stage: 'survey', state: null },
      { ownerId: 'rajesh', stage: 'survey', state: 'snoozed' },
      { ownerId: 'anita', stage: 'qualified', state: null },
      { ownerId: 'gone', stage: 'qualified', state: null },
      { ownerId: null, stage: 'new', state: null },
    ];
    const tasks: LoadTask[] = [
      { assigneeId: 'rajesh', status: 'open', dueAt: NOW - 1 },
      { assigneeId: 'rajesh', status: 'open', dueAt: NOW + 1 },
      { assigneeId: 'rajesh', status: 'done', dueAt: NOW - 1 },
      { assigneeId: 'anita', status: 'cancelled', dueAt: NOW - 1 },
    ];
    expect([...memberLoads(['rajesh', 'anita', 'meera'], leads, tasks, NOW)]).toEqual([
      ['rajesh', { open: 2, overdue: 1 }],
      ['anita', { open: 1, overdue: 0 }],
      ['meera', { open: 0, overdue: 0 }],
    ]);
  });
});
