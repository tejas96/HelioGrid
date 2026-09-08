import { type CapabilityRow, DENIED, GRANTED } from './cells';

/**
 * F2 §F2.5-M06 — Proposals. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const PROPOSALS_ROWS = {
  // Create and edit proposals — includes applying discounts; there is no separate discount permission and no appro
  'proposals.create_edit_proposals': {
    rowKey: 'F2.M06.create-edit-proposals',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: DENIED,
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
  // Send proposals to customers
  'proposals.send_proposals': {
    rowKey: 'F2.M06.send-proposals',
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
