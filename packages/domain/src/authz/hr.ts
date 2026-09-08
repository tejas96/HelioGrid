import {
  type CapabilityRow,
  DENIED,
  GRANTED,
  none,
  scope,
  type VisibilityDomain,
  type VisibilityRow,
} from './cells';

/**
 * F2 §F2.5-M10 — HR-lite. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const HR_ROWS = {
  // Request one's **own** leave
  'hr.request_leave': {
    rowKey: 'F2.M10.request-leave',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: GRANTED,
      design_engineer: GRANTED,
      project_manager: GRANTED,
      field_technician: GRANTED,
      installation_team_member: GRANTED,
      hr_admin: GRANTED,
      finance: GRANTED,
      operations: GRANTED,
      marketing: GRANTED,
    },
  },
  // Approve or decline a leave request
  'hr.decide_leave': {
    rowKey: 'F2.M10.decide-leave',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: GRANTED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  // Set or change an employee's manager mapping (the membership data every **Team** visibility cell resolves over)
  'hr.manage_team_structure': {
    rowKey: 'F2.M10.manage-team-structure',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
} as const satisfies Record<string, CapabilityRow>;

export const HR_VISIBILITY = {
  // Read and edit employee records; upload and manage employee documents (the `F2-14` **people records** domain as
  people: {
    rowKey: 'F2.M10.people-records',
    cells: {
      epc_owner: scope('all', 'all'),
      sales_manager: none,
      sales_executive: none,
      survey_engineer: none,
      design_engineer: none,
      project_manager: none,
      field_technician: none,
      installation_team_member: none,
      hr_admin: scope('all', 'all'),
      finance: none,
      operations: none,
      marketing: none,
    },
  },
} as const satisfies Partial<Record<VisibilityDomain, VisibilityRow>>;
