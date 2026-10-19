import type { RolePreset } from './roles';

/**
 * The kind of work a preset does — selling and leading, planning and running, or work on site — so
 * a list of people reads at a glance: a role label takes its kind's colour (design-system change 7).
 * A `Record` over every preset, so a new preset fails typecheck until it is given a kind.
 */
export const ROLE_KINDS = ['sell', 'plan', 'site'] as const;
export type RoleKind = (typeof ROLE_KINDS)[number];

const KIND_OF: Record<RolePreset, RoleKind> = {
  epc_owner: 'sell',
  sales_manager: 'sell',
  sales_executive: 'sell',
  marketing: 'sell',
  survey_engineer: 'plan',
  design_engineer: 'plan',
  project_manager: 'plan',
  operations: 'plan',
  finance: 'plan',
  hr_admin: 'plan',
  field_technician: 'site',
  installation_team_member: 'site',
};

export function roleKind(preset: RolePreset): RoleKind {
  return KIND_OF[preset];
}
