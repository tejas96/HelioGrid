import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import { roleHolders } from '../../src/tenancy/role-holders';
import type { TeamRow, TeamRowStatus } from '../../src/tenancy/team-roster';

const row = (name: string, status: TeamRowStatus, roles: readonly RolePreset[]): TeamRow => ({
  id: name,
  name,
  phoneE164: '+919800000000',
  roles,
  status,
  isViewer: false,
  lastActiveAt: null,
  expiresAt: null,
  inviteDay: null,
});

const roster = [
  row('Priya Deshmukh', 'invited', ['sales_executive']),
  row('Ravi Expired', 'expired', ['sales_executive']),
  row('Amit Rane', 'active', ['sales_executive', 'survey_engineer']),
  row('Anjali Kulkarni', 'active', ['sales_executive']),
  row('Rajesh Kulkarni', 'active', ['epc_owner']),
  row('Deepak Jadhav', 'deactivated', ['installation_team_member']),
];

describe('roleHolders', () => {
  it('counts active members only', () => {
    const holders = roleHolders(roster);
    expect(holders.sales_executive.count).toBe(2);
    expect(holders.sales_executive.holders).toEqual(['Amit Rane', 'Anjali Kulkarni']);
    expect(holders.survey_engineer.count).toBe(1);
    expect(holders.epc_owner.count).toBe(1);
  });

  it('names an open invite and a deactivated person beside the count', () => {
    const holders = roleHolders(roster);
    expect(holders.sales_executive.others).toEqual([
      { id: 'Priya Deshmukh', name: 'Priya Deshmukh', status: 'invited' },
    ]);
    expect(holders.installation_team_member).toEqual({
      count: 0,
      holders: [],
      others: [{ id: 'Deepak Jadhav', name: 'Deepak Jadhav', status: 'deactivated' }],
    });
  });

  it('names no expired invite', () => {
    const named = roleHolders(roster).sales_executive.others.map((other) => other.name);
    expect(named).not.toContain('Ravi Expired');
  });

  it('gives every preset an entry, zero when nobody holds it', () => {
    const holders = roleHolders([]);
    expect(Object.keys(holders)).toHaveLength(12);
    expect(holders.marketing).toEqual({ count: 0, holders: [], others: [] });
  });
});
