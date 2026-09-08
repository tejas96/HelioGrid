import {
  type CapabilityRow,
  DENIED,
  GRANTED,
  limited,
  none,
  scope,
  type VisibilityDomain,
  type VisibilityRow,
} from './cells';

/**
 * F2 §F2.5-M08 — Projects. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const PROJECTS_ROWS = {
  // Update project stages
  'projects.update_stages': {
    rowKey: 'F2.M08.update-stages',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: GRANTED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  // Upload and verify project documents
  'projects.project_documents': {
    rowKey: 'F2.M08.project-documents',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: GRANTED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  // Work the installation checklist (tick steps, attach photo evidence)
  'projects.installation_checklist': {
    rowKey: 'F2.M08.installation-checklist',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: limited('coordinator, F2-07 attribution'),
      field_technician: DENIED,
      installation_team_member: limited('surface obeys F2-06'),
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
} as const satisfies Record<string, CapabilityRow>;

export const PROJECTS_VISIBILITY = {
  // Project visibility scope (the F2-14 projects domain as cells)
  projects: {
    rowKey: 'F2.M08.project-visibility',
    cells: {
      epc_owner: scope('all'),
      sales_manager: scope('team'),
      sales_executive: scope('own', '(read-only)'),
      survey_engineer: none,
      design_engineer: none,
      project_manager: scope('own', 'projects'),
      field_technician: none,
      installation_team_member: scope('assigned', 'job only'),
      hr_admin: none,
      finance: scope('all', '(money scope)'),
      operations: scope('portfolio'),
      marketing: none,
    },
  },
} as const satisfies Partial<Record<VisibilityDomain, VisibilityRow>>;
