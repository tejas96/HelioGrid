import { describe, expect, it } from 'vitest';
import { ROLE_KINDS, roleKind } from '../../src/authz/role-kinds';
import { ROLE_PRESETS, type RolePreset } from '../../src/authz/roles';

describe('roleKind — every preset is one kind of work (design-system change 7)', () => {
  it.each<[RolePreset, (typeof ROLE_KINDS)[number]]>([
    ['epc_owner', 'sell'],
    ['sales_manager', 'sell'],
    ['sales_executive', 'sell'],
    ['marketing', 'sell'],
    ['survey_engineer', 'plan'],
    ['design_engineer', 'plan'],
    ['project_manager', 'plan'],
    ['operations', 'plan'],
    ['finance', 'plan'],
    ['hr_admin', 'plan'],
    ['field_technician', 'site'],
    ['installation_team_member', 'site'],
  ])('%s is %s', (preset, kind) => {
    expect(roleKind(preset)).toBe(kind);
  });

  it('gives each of the twelve presets a kind the list names', () => {
    expect(ROLE_PRESETS.every((preset) => ROLE_KINDS.includes(roleKind(preset)))).toBe(true);
  });
});
