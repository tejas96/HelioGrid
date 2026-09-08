import { type CapabilityRow, DENIED, GRANTED } from './cells';

/**
 * F2 §F2.5-M11 — Payments & collections. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const PAYMENTS_ROWS = {
  // Record payments against tranches (with mode and receipt)
  'payments.record_payments': {
    rowKey: 'F2.M11.record-payments',
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
      finance: GRANTED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  // Connect, rotate and disconnect the tenant's own collections account (credentials write-only, last-4 only)
  'payments.connect_gateway': {
    rowKey: 'F2.M11.connect-gateway',
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
  // Send the plain payment-request message — the request message alone, carrying **no** payment link — from the te
  'payments.send_request_message': {
    rowKey: 'F2.M11.send-request-message',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: GRANTED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: GRANTED,
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  // Waive a tranche (terminal, reason mandatory, never counted as collected)
  'payments.waive_tranche': {
    rowKey: 'F2.M11.waive-tranche',
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
      finance: GRANTED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
} as const satisfies Record<string, CapabilityRow>;
