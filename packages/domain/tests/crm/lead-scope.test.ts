import { describe, expect, it } from 'vitest';
import { CRM_VISIBILITY } from '../../src/authz/crm';
import { ROLE_PRESETS, type RolePreset } from '../../src/authz/roles';
import { type LeadReach, leadScopeOf } from '../../src/crm/lead-scope';

describe('leadScopeOf — the leads row as one predicate (F2-12…F2-14)', () => {
  it.each<[readonly RolePreset[], 'all' | readonly LeadReach[]]>([
    [['epc_owner'], 'all'],
    [['sales_manager'], ['owned_by_me', 'unassigned_queue']],
    [['sales_executive'], ['owned_by_me']],
    [['survey_engineer'], ['my_booked_visits']],
    [['design_engineer'], ['my_booked_visits']],
    [['project_manager'], []],
    [['field_technician'], []],
    [['installation_team_member'], []],
    [['hr_admin'], []],
    [['finance'], []],
    [['operations'], []],
    [['marketing'], ['my_unassigned_captures']],
    [[], []],
    [
      ['sales_executive', 'marketing'],
      ['owned_by_me', 'my_unassigned_captures'],
    ],
    [
      ['marketing', 'survey_engineer'],
      ['my_unassigned_captures', 'my_booked_visits'],
    ],
    [
      ['sales_manager', 'survey_engineer'],
      ['owned_by_me', 'unassigned_queue', 'my_booked_visits'],
    ],
    [
      ['sales_manager', 'marketing'],
      ['owned_by_me', 'unassigned_queue'],
    ],
    [['epc_owner', 'field_technician'], 'all'],
    [['project_manager', 'operations'], []],
  ])('%j reaches %j', (roles, reaches) => {
    expect(leadScopeOf(roles)).toEqual(
      reaches === 'all' ? { kind: 'all' } : { kind: 'reaches', reaches },
    );
  });

  it('every qualified own cell of the leads row is read — none fails closed unseen', () => {
    const qualifiedOwn = ROLE_PRESETS.filter((preset) => {
      const cell = CRM_VISIBILITY.leads.cells[preset];
      return cell.scope === 'own' && !('through' in cell) && 'qualifier' in cell;
    });
    expect(qualifiedOwn).toEqual(['marketing']);
    for (const preset of qualifiedOwn) {
      expect(leadScopeOf([preset])).not.toEqual({ kind: 'reaches', reaches: [] });
    }
  });
});
