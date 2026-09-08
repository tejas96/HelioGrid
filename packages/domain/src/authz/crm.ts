import {
  type CapabilityRow,
  DENIED,
  GRANTED,
  none,
  scope,
  through,
  type VisibilityDomain,
  type VisibilityRow,
} from './cells';

/**
 * F2 §F2.5-M02 — CRM & leads. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const CRM_ROWS = {
  // Add and edit leads
  'crm.add_edit_leads': {
    rowKey: 'F2.M02.add-edit-leads',
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
  // Assign leads to others
  'crm.assign_leads': {
    rowKey: 'F2.M02.assign-leads',
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
  // Delete leads
  'crm.delete_leads': {
    rowKey: 'F2.M02.delete-leads',
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
  // Create a lead despite a detected duplicate (reason mandatory, audited)
  'crm.dedupe_override': {
    rowKey: 'F2.M02.dedupe-override',
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
  // Bulk-import leads from a file (mapping → preview → import)
  'crm.import_leads': {
    rowKey: 'F2.M02.import-leads',
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
  // Move a lead into and out of the parking/terminal states (snooze, disqualify, junk, reopen)
  'crm.lead_state_changes': {
    rowKey: 'F2.M02.lead-state-changes',
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
  // Book a site visit from a lead (date, time, surveyor, address)
  'crm.book_site_visit': {
    rowKey: 'F2.M02.book-site-visit',
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
  // Merge two customer records onto a survivor (irreversible, audited)
  'crm.merge_customers': {
    rowKey: 'F2.M02.merge-customers',
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
} as const satisfies Record<string, CapabilityRow>;

export const CRM_VISIBILITY = {
  // Lead visibility scope (the F2-12 law as cells)
  leads: {
    rowKey: 'F2.M02.lead-visibility',
    cells: {
      epc_owner: scope('all'),
      sales_manager: scope('team'),
      sales_executive: scope('own'),
      survey_engineer: scope('assigned'),
      design_engineer: scope('assigned'),
      project_manager: through('projects', 'own', "projects' deals (read)"),
      field_technician: none,
      installation_team_member: none,
      hr_admin: none,
      finance: none,
      operations: through('projects', 'portfolio', 'deals (read)'),
      marketing: scope('own', 'captures until triage'),
    },
  },
} as const satisfies Partial<Record<VisibilityDomain, VisibilityRow>>;
