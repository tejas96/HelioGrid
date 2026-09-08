import { type CapabilityRow, DENIED, GRANTED, limited } from './cells';

/**
 * F2 §F2.5-M07 — Sales execution. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const SALES_ROWS = {
  // See agent performance (the per-rep view is Sales Manager's and the EPC Owner's)
  'sales.agent_performance': {
    rowKey: 'F2.M07.agent-performance',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
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
  // Hand a lead to the voice agent on demand (D17's second trigger path)
  'sales.hand_lead_to_agent': {
    rowKey: 'F2.M07.hand-lead-to-agent',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
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
  // See the agent call queue (who is scheduled, when, and why)
  'sales.see_agent_queue': {
    rowKey: 'F2.M07.see-agent-queue',
    grants: {
      epc_owner: limited('All'),
      sales_manager: limited('Team'),
      sales_executive: limited('Own'),
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
  // Remove or cancel queued agent calls (Owner: anything; queuing rep: own queued entries; every cancellation logg
  'sales.control_agent_queue': {
    rowKey: 'F2.M07.control-agent-queue',
    grants: {
      epc_owner: GRANTED,
      sales_manager: limited('Own queued'),
      sales_executive: limited('Own queued'),
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
  // Mark a lead won or lost (the close surfaces; mandatory reason on lost)
  'sales.mark_won_lost': {
    rowKey: 'F2.M07.mark-won-lost',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
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
