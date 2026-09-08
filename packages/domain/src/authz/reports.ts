import { type CapabilityRow, DENIED, limited } from './cells';

/**
 * F2 §F2.5-M13 — Dashboards & reporting. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const REPORTS_ROWS = {
  // See company reports
  'reports.company_reports': {
    rowKey: 'F2.M13.company-reports',
    grants: {
      epc_owner: limited('all'),
      sales_manager: limited('team-scoped'),
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
