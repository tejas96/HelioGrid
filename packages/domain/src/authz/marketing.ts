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
 * F2 §F2.5-M03 — Marketing. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const MARKETING_ROWS = {
  // Create, schedule, run, pause and cancel campaigns
  'marketing.manage_campaigns': {
    rowKey: 'F2.M03.manage-campaigns',
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
      marketing: GRANTED,
    },
  },
  // Build a campaign audience from CRM segments — resolved over the **whole lead base, aggregate-only** (filters,
  'marketing.build_campaign_audience': {
    rowKey: 'F2.M03.build-campaign-audience',
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
      marketing: GRANTED,
    },
  },
  // Author campaign content and per-language campaign templates, and submit them for channel registration
  'marketing.author_campaign_content': {
    rowKey: 'F2.M03.author-campaign-content',
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
      marketing: GRANTED,
    },
  },
  // Connect, reconnect and disconnect a channel identity (email, business messaging, SMS, social, website form)
  'marketing.manage_channel_connections': {
    rowKey: 'F2.M03.manage-channel-connections',
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
  // Approve spend-adjacent campaign settings — a send beyond the included allowance, an overage-incurring schedule
  'marketing.approve_campaign_spend': {
    rowKey: 'F2.M03.approve-campaign-spend',
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

export const MARKETING_VISIBILITY = {
  // Campaign visibility scope (the `F2-14` **campaigns** domain as cells)
  campaigns: {
    rowKey: 'F2.M03.campaign-visibility',
    cells: {
      epc_owner: scope('all'),
      sales_manager: scope('all', 'Read (results)'),
      sales_executive: none,
      survey_engineer: none,
      design_engineer: none,
      project_manager: none,
      field_technician: none,
      installation_team_member: none,
      hr_admin: none,
      finance: none,
      operations: none,
      marketing: scope('all'),
    },
  },
} as const satisfies Partial<Record<VisibilityDomain, VisibilityRow>>;
