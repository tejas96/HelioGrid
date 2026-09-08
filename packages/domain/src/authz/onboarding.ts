import { type CapabilityRow, DENIED, GRANTED, limited } from './cells';

/**
 * F2 §F2.5-M01 — Onboarding & tenant configuration. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const ONBOARDING_ROWS = {
  // Manage team and roles
  'onboarding.manage_team': {
    rowKey: 'F2.M01.manage-team',
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
  // Configure the agent and its knowledge
  'onboarding.configure_agent': {
    rowKey: 'F2.M01.configure-agent',
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
  // Manage catalog and price book (author items, publish price-book versions)
  'onboarding.manage_catalog': {
    rowKey: 'F2.M01.manage-catalog',
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
      finance: limited('view prices & margins'),
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  // Configure tenant settings (business profile, branding, document templates, payment-term templates, message tem
  'onboarding.manage_tenant_settings': {
    rowKey: 'F2.M01.manage-tenant-settings',
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
  // Add tenant catalog products inline while designing or quoting (single product · datasheet PDF · spreadsheet im
  'onboarding.add_own_catalog_items': {
    rowKey: 'F2.M01.add-own-catalog-items',
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
      operations: GRANTED,
      marketing: DENIED,
    },
  },
} as const satisfies Record<string, CapabilityRow>;
