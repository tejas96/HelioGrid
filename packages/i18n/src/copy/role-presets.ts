import type { RolePreset } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * What each preset can do, in one line (`SCR-M01-07`, shared with `SCR-M01-13` word for word). The
 * EPC Owner's line says *company settings*, never *tenant settings* (`F7-42`).
 */
const PRESET_LINE: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ {
    id: 'Everything, including team and roles, the agent, billing and company settings',
  },
  sales_manager: /*i18n*/ {
    id: 'The team’s leads and proposals, project stages, payments and team reports',
  },
  sales_executive: /*i18n*/ {
    id: 'Their own leads, surveys and proposals, including discounts, sending and marking won or lost',
  },
  survey_engineer: /*i18n*/ { id: 'Capture and submit surveys for the leads assigned to them' },
  design_engineer: /*i18n*/ {
    id: 'Designs and proposals for the leads assigned to them, and design sign-off',
  },
  project_manager: /*i18n*/ {
    id: 'Their own projects’ stages, documents, payments and installation checklist',
  },
  field_technician: /*i18n*/ { id: 'Their own stops, check-ins, timeline and attendance' },
  installation_team_member: /*i18n*/ {
    id: 'The installation job assigned to them, its checklist and photos',
  },
  hr_admin: /*i18n*/ { id: 'Employee records, documents, attendance and leave' },
  finance: /*i18n*/ {
    id: 'Record payments, attach receipts, read any project’s money, and see catalog prices and margins',
  },
  operations: /*i18n*/ {
    id: 'Project stages, documents and blockers across all projects, plus the catalog and price book',
  },
  marketing: /*i18n*/ {
    id: 'Create and run campaigns, see what they captured, and pass enquiries into the lead queue',
  },
};

export function presetAbility(translate: Translator['t'], preset: RolePreset): string {
  return translate(PRESET_LINE[preset]);
}

/**
 * Each preset in a few words, under its name on the Roles reference's tile head (`SCR-M01-14`,
 * F2 §F2.1); the details list carries the whole grant. `PRESET_LINE` is the option row's sentence.
 */
export const PRESET_SUMMARY: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ { id: 'Everything, always' },
  sales_manager: /*i18n*/ { id: 'The team’s leads, proposals and payments' },
  sales_executive: /*i18n*/ { id: 'Their own leads, surveys and proposals' },
  survey_engineer: /*i18n*/ { id: 'Surveys for the leads assigned to them' },
  design_engineer: /*i18n*/ { id: 'Designs, proposals and design sign-off' },
  project_manager: /*i18n*/ { id: 'Their own projects and payments' },
  field_technician: /*i18n*/ { id: 'Their own stops, check-ins and attendance' },
  installation_team_member: /*i18n*/ { id: 'The installation job assigned to them' },
  hr_admin: /*i18n*/ { id: 'Employee records, attendance and leave' },
  finance: /*i18n*/ { id: 'Payments, receipts and project money' },
  operations: /*i18n*/ { id: 'All projects, the catalog and price book' },
  marketing: /*i18n*/ { id: 'Campaigns and the enquiries they capture' },
};

export function presetSummary(translate: Translator['t'], preset: RolePreset): string {
  return translate(PRESET_SUMMARY[preset]);
}
