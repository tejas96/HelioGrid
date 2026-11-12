import { describe, expect, it } from 'vitest';
import { can } from '../../src/authz';
import { ROLE_PRESETS, type RolePreset } from '../../src/authz/roles';
import { crewJobRank } from '../../src/projects/people';
import {
  moneyScopeOf,
  type ProjectScope,
  projectScopeOf,
  seesOnlyTheJob,
} from '../../src/projects/scope';

describe('projectScopeOf — which projects a person sees, from their presets alone (F2-14, F2-15)', () => {
  it.each([
    [['epc_owner'], { kind: 'all' }],
    [['finance'], { kind: 'all' }],
    [['operations'], { kind: 'all' }],
    [['epc_owner', 'installation_team_member'], { kind: 'all' }],
    [['sales_manager'], { kind: 'reaches', reaches: ['sold_by_me', 'managed_by_me'] }],
    [['sales_executive'], { kind: 'reaches', reaches: ['sold_by_me'] }],
    [['project_manager'], { kind: 'reaches', reaches: ['managed_by_me'] }],
    [['installation_team_member'], { kind: 'reaches', reaches: ['crew_on'] }],
    [
      ['project_manager', 'installation_team_member'],
      { kind: 'reaches', reaches: ['managed_by_me', 'crew_on'] },
    ],
    [
      ['installation_team_member', 'sales_executive', 'project_manager'],
      { kind: 'reaches', reaches: ['sold_by_me', 'managed_by_me', 'crew_on'] },
    ],
    [
      ['sales_manager', 'sales_executive'],
      { kind: 'reaches', reaches: ['sold_by_me', 'managed_by_me'] },
    ],
    [['survey_engineer'], { kind: 'reaches', reaches: [] }],
    [['marketing', 'hr_admin'], { kind: 'reaches', reaches: [] }],
    [[], { kind: 'reaches', reaches: [] }],
  ] as const)('%j sees %j', (roles, scope) => {
    expect(projectScopeOf(roles as readonly RolePreset[])).toEqual(scope);
  });
});

describe('seesOnlyTheJob — the installer reaches the job and its photos, no paper (M08-43)', () => {
  it.each([
    { held: ['installation_team_member'], only: true },
    { held: ['installation_team_member', 'project_manager'], only: false },
    { held: ['project_manager'], only: false },
    { held: ['epc_owner'], only: false },
    { held: [], only: false },
  ] as const)('$held → $only', ({ held, only }) => {
    expect(seesOnlyTheJob(projectScopeOf(held))).toBe(only);
  });
});

describe('crewJobRank — the order an installer’s jobs come in', () => {
  it.each([
    ['installation', 'dispatched'],
    ['electrical_metering', 'dispatched'],
    ['installation', 'electrical_metering'],
    ['dispatched', 'won'],
  ])('a job at %s comes before one at %s', (sooner, later) => {
    expect(crewJobRank(sooner)).toBeLessThan(crewJobRank(later));
  });
});

describe('moneyScopeOf — no commercial figure reaches the crew (M11-56)', () => {
  it.each([
    ['everyone', { kind: 'all' }, { kind: 'all' }],
    ['a manager who is also crew', ['managed_by_me', 'crew_on'], ['managed_by_me']],
    ['the crew alone', ['crew_on'], []],
    ['the seller', ['sold_by_me'], ['sold_by_me']],
  ] as const)('%s', (_, from, to) => {
    const scope = (reaches: unknown) =>
      Array.isArray(reaches) ? { kind: 'reaches' as const, reaches } : reaches;
    expect(moneyScopeOf(scope(from) as ProjectScope)).toEqual(scope(to));
  });
});

describe('moneyScopeOf — whoever sees a project’s money may share its pay request (M11-53)', () => {
  /* The Money card offers Share to every reader of its figures: a preset that sees money without
     the send would be offered an act the server refuses. */
  it.each(ROLE_PRESETS)('%s', (preset) => {
    const money = moneyScopeOf(projectScopeOf([preset]));
    const seesMoney = money.kind === 'all' || money.reaches.length > 0;
    if (seesMoney) expect(can([preset], 'payments.send_request_message')).toBe(true);
  });
});
