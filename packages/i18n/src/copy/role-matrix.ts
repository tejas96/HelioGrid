import type { ReferenceRow, ReferenceScope } from '@heliogrid/domain';

/**
 * Each matrix row in the person's words, F2 §F2.5's own phrase up to its first qualifier
 * (`SCR-M01-14`). A row added to the matrix fails to compile here until it has its words.
 */
export const REFERENCE_ROW: Record<ReferenceRow, { id: string }> = {
  'onboarding.manage_team': /*i18n*/ { id: 'Manage team and roles' },
  'onboarding.configure_agent': /*i18n*/ { id: 'Configure the agent and its knowledge' },
  'onboarding.manage_catalog': /*i18n*/ { id: 'Manage catalog and price book' },
  'onboarding.manage_tenant_settings': /*i18n*/ { id: 'Configure company settings' },
  'onboarding.add_own_catalog_items': /*i18n*/ {
    id: 'Add company catalog products inline while designing or writing a proposal',
  },
  leads: /*i18n*/ { id: 'Lead visibility scope' },
  'crm.add_edit_leads': /*i18n*/ { id: 'Add and edit leads' },
  'crm.assign_leads': /*i18n*/ { id: 'Assign leads to others' },
  'crm.delete_leads': /*i18n*/ { id: 'Delete leads' },
  'crm.dedupe_override': /*i18n*/ { id: 'Create a lead despite a detected duplicate' },
  'crm.import_leads': /*i18n*/ { id: 'Bulk-import leads from a file' },
  'crm.lead_state_changes': /*i18n*/ {
    id: 'Move a lead into and out of the parking/terminal states',
  },
  'crm.book_site_visit': /*i18n*/ { id: 'Book a site visit from a lead' },
  'crm.merge_customers': /*i18n*/ { id: 'Merge two customer records onto a survivor' },
  campaigns: /*i18n*/ { id: 'Campaign visibility scope' },
  'marketing.manage_campaigns': /*i18n*/ {
    id: 'Create, schedule, run, pause and cancel campaigns',
  },
  'marketing.build_campaign_audience': /*i18n*/ {
    id: 'Build a campaign audience from CRM segments',
  },
  'marketing.author_campaign_content': /*i18n*/ {
    id: 'Author campaign content and per-language campaign templates, and submit them for channel registration',
  },
  'marketing.manage_channel_connections': /*i18n*/ {
    id: 'Connect, reconnect and disconnect a channel identity',
  },
  'marketing.approve_campaign_spend': /*i18n*/ { id: 'Approve spend-adjacent campaign settings' },
  'survey.capture_surveys': /*i18n*/ { id: 'Capture site surveys' },
  'survey.run_remote_survey': /*i18n*/ { id: 'Run a remote survey' },
  'survey.schedule_survey_visits': /*i18n*/ {
    id: 'Schedule, reassign and cancel site-survey visits',
  },
  'survey.resolve_survey_gaps': /*i18n*/ { id: 'Resolve or waive a remote-survey gap' },
  'studio.create_edit_designs': /*i18n*/ { id: 'Create and edit designs' },
  'studio.approve_designs': /*i18n*/ { id: 'Approve designs' },
  'studio.run_roof_detection': /*i18n*/ {
    id: 'Run in-canvas AI roof detection on the studio canvas',
  },
  'proposals.create_edit_proposals': /*i18n*/ { id: 'Create and edit proposals' },
  'proposals.send_proposals': /*i18n*/ { id: 'Send proposals to customers' },
  'sales.agent_performance': /*i18n*/ { id: 'See agent performance' },
  'sales.hand_lead_to_agent': /*i18n*/ { id: 'Hand a lead to the voice agent on demand' },
  'sales.see_agent_queue': /*i18n*/ { id: 'See the agent call queue' },
  'sales.control_agent_queue': /*i18n*/ { id: 'Remove or cancel queued agent calls' },
  'sales.mark_won_lost': /*i18n*/ { id: 'Mark a lead won or lost' },
  'projects.update_stages': /*i18n*/ { id: 'Update project stages' },
  'projects.project_documents': /*i18n*/ { id: 'Upload and verify project documents' },
  'projects.installation_checklist': /*i18n*/ { id: 'Work the installation checklist' },
  projects: /*i18n*/ { id: 'Project visibility scope' },
  field_work: /*i18n*/ { id: 'Field-work visibility scope' },
  'field.check_in_out': /*i18n*/ {
    id: 'Check in and out of a site, and log a visit and its outcome',
  },
  'field.mark_attendance': /*i18n*/ { id: 'Mark one’s own day start and day end' },
  'field.attendance_visibility': /*i18n*/ { id: 'Read others’ attendance records' },
  'field.toggle_tracked_seat': /*i18n*/ { id: 'Turn per-employee field tracking on or off' },
  'field.manage_geofences': /*i18n*/ { id: 'Define a site’s geofence and adjust its radius' },
  'field.view_live_location': /*i18n*/ {
    id: 'See another person’s live position, route timeline, movement history and day playback',
  },
  people: /*i18n*/ {
    id: 'Read and edit employee records; upload and manage employee documents',
  },
  'hr.request_leave': /*i18n*/ { id: 'Request one’s own leave' },
  'hr.decide_leave': /*i18n*/ { id: 'Approve or decline a leave request' },
  'hr.manage_team_structure': /*i18n*/ { id: 'Set or change an employee’s manager mapping' },
  'payments.record_payments': /*i18n*/ { id: 'Record payments against tranches' },
  'payments.connect_gateway': /*i18n*/ {
    id: 'Connect, rotate and disconnect the company’s own collections account',
  },
  'payments.send_request_message': /*i18n*/ { id: 'Send the plain payment-request message' },
  'payments.waive_tranche': /*i18n*/ { id: 'Waive a tranche' },
  'billing.manage_billing': /*i18n*/ { id: 'Manage the company’s platform billing' },
  'billing.view_usage_and_invoices': /*i18n*/ {
    id: 'Open the usage screen and the subscription invoice list',
  },
  'reports.company_reports': /*i18n*/ { id: 'See company reports' },
  'customer_link.mint_customer_link': /*i18n*/ {
    id: 'Mint, label and re-mint a customer link for a named contact',
  },
  'customer_link.revoke_customer_link': /*i18n*/ {
    id: 'Revoke a customer link, including regenerate-with-revoke',
  },
};

/** The person's part of a scoped cell, after the row's words and a *·*. */
export const REFERENCE_SCOPE: Record<ReferenceScope, { id: string }> = {
  all: /*i18n*/ { id: 'All' },
  team: /*i18n*/ { id: 'Team' },
  own: /*i18n*/ { id: 'Own' },
  assigned: /*i18n*/ { id: 'Assigned' },
  portfolio: /*i18n*/ { id: 'Portfolio' },
  own_queued: /*i18n*/ { id: 'Own queued' },
  own_visits: /*i18n*/ { id: 'Own visits' },
  own_projects: /*i18n*/ { id: 'Own projects' },
  own_projects_field_work: /*i18n*/ { id: 'Own projects’ field work' },
  own_projects_field_workers: /*i18n*/ { id: 'Own projects’ field workers' },
  own_projects_deals_read: /*i18n*/ { id: 'Own projects’ deals (read)' },
  portfolio_deals_read: /*i18n*/ { id: 'Portfolio deals (read)' },
  own_captures_until_triage: /*i18n*/ { id: 'Own captures until triage' },
  own_read_only: /*i18n*/ { id: 'Own (read-only)' },
  assigned_job_only: /*i18n*/ { id: 'Assigned job only' },
  all_money_scope: /*i18n*/ { id: 'All (money scope)' },
  read_results: /*i18n*/ { id: 'Read (results)' },
  view_prices_margins: /*i18n*/ { id: 'View prices & margins' },
  team_scoped: /*i18n*/ { id: 'Team-scoped' },
  coordinator: /*i18n*/ { id: 'Coordinator' },
};
