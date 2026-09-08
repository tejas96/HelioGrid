import { type CapabilityRow, DENIED, GRANTED, limited } from './cells';

/**
 * F2 §F2.5-M04 — Survey. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const SURVEY_ROWS = {
  // Capture site surveys
  'survey.capture_surveys': {
    rowKey: 'F2.M04.capture-surveys',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: GRANTED,
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
  // Run a remote survey (address → imagery → AI roof detection); manual outlining is inside this grant and is neve
  'survey.run_remote_survey': {
    rowKey: 'F2.M04.run-remote-survey',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: GRANTED,
      design_engineer: GRANTED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  // Schedule, reassign and cancel site-survey visits
  'survey.schedule_survey_visits': {
    rowKey: 'F2.M04.schedule-survey-visits',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: limited('Own visits'),
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
  // Resolve or waive a remote-survey gap (ask the customer · capture on site · resolved · waived)
  'survey.resolve_survey_gaps': {
    rowKey: 'F2.M04.resolve-survey-gaps',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: GRANTED,
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
