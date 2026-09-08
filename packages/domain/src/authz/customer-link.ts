import { type CapabilityRow, DENIED, GRANTED } from './cells';

/**
 * F2 §F2.5-F5 — Customer-link surfaces. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const CUSTOMER_LINK_ROWS = {
  // Mint, label and re-mint a customer link for a named contact
  'customer_link.mint_customer_link': {
    rowKey: 'F2.F5.mint-customer-link',
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
  // Revoke a customer link, including regenerate-with-revoke
  'customer_link.revoke_customer_link': {
    rowKey: 'F2.F5.revoke-customer-link',
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
