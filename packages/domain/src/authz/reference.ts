import { CAPABILITY_MATRIX, type Capability } from './capabilities';
import type { VisibilityCell, VisibilityDomain, VisibilityRow } from './cells';
import type { RolePreset } from './roles';
import { VISIBILITY_MATRIX } from './visibility';

/**
 * The Roles reference (`SCR-M01-14`, `M01-21`) reads the whole matrix as one list: F2 §F2.5's tables
 * in F2's order, each table's visibility row inside it, every capability and visibility row once.
 * The words are `packages/i18n`'s, one per row; a row missing here leaves a grant off the screen.
 */
export const REFERENCE_ROWS = [
  'onboarding.manage_team',
  'onboarding.configure_agent',
  'onboarding.manage_catalog',
  'onboarding.manage_tenant_settings',
  'onboarding.add_own_catalog_items',
  'leads',
  'crm.add_edit_leads',
  'crm.assign_leads',
  'crm.delete_leads',
  'crm.dedupe_override',
  'crm.import_leads',
  'crm.lead_state_changes',
  'crm.book_site_visit',
  'crm.merge_customers',
  'campaigns',
  'marketing.manage_campaigns',
  'marketing.build_campaign_audience',
  'marketing.author_campaign_content',
  'marketing.manage_channel_connections',
  'marketing.approve_campaign_spend',
  'survey.capture_surveys',
  'survey.run_remote_survey',
  'survey.schedule_survey_visits',
  'survey.resolve_survey_gaps',
  'studio.create_edit_designs',
  'studio.approve_designs',
  'studio.run_roof_detection',
  'proposals.create_edit_proposals',
  'proposals.send_proposals',
  'sales.agent_performance',
  'sales.hand_lead_to_agent',
  'sales.see_agent_queue',
  'sales.control_agent_queue',
  'sales.mark_won_lost',
  'projects.update_stages',
  'projects.project_documents',
  'projects.installation_checklist',
  'projects',
  'field_work',
  'field.check_in_out',
  'field.mark_attendance',
  'field.attendance_visibility',
  'field.toggle_tracked_seat',
  'field.manage_geofences',
  'field.view_live_location',
  'people',
  'hr.request_leave',
  'hr.decide_leave',
  'hr.manage_team_structure',
  'payments.record_payments',
  'payments.connect_gateway',
  'payments.send_request_message',
  'payments.waive_tranche',
  'billing.manage_billing',
  'billing.view_usage_and_invoices',
  'reports.company_reports',
  'customer_link.mint_customer_link',
  'customer_link.revoke_customer_link',
] as const satisfies readonly (Capability | VisibilityDomain)[];
export type ReferenceRow = (typeof REFERENCE_ROWS)[number];

/**
 * The person's part of a scoped cell — what follows *·* after a row's words. A cell's PRD rule id
 * never reaches the screen (`D247`): the matrix keeps F2's cell verbatim, and only this vocabulary
 * drops the id.
 */
export const REFERENCE_SCOPES = [
  'all',
  'team',
  'own',
  'assigned',
  'portfolio',
  'own_queued',
  'own_visits',
  'own_projects',
  'own_projects_field_work',
  'own_projects_field_workers',
  'own_projects_deals_read',
  'portfolio_deals_read',
  'own_captures_until_triage',
  'own_read_only',
  'assigned_job_only',
  'all_money_scope',
  'read_results',
  'view_prices_margins',
  'team_scoped',
  'coordinator',
] as const;
export type ReferenceScope = (typeof REFERENCE_SCOPES)[number];

/** A capability cell's phrase, read as a scope; `null` for a phrase that is only a PRD rule id. */
const LIMIT_SCOPE: Readonly<Record<string, ReferenceScope | null>> = {
  All: 'all',
  all: 'all',
  Team: 'team',
  Own: 'own',
  'Own queued': 'own_queued',
  'Own visits': 'own_visits',
  "Own projects' field work": 'own_projects_field_work',
  "Own projects' field workers": 'own_projects_field_workers',
  'view prices & margins': 'view_prices_margins',
  'team-scoped': 'team_scoped',
  'coordinator, F2-07 attribution': 'coordinator',
  'surface obeys F2-06': null,
};

/** A visibility cell's scope word and qualifier, read as a scope. */
const VISIBILITY_SCOPE: Readonly<Record<string, ReferenceScope>> = {
  all: 'all',
  'all|all': 'all',
  team: 'team',
  own: 'own',
  assigned: 'assigned',
  portfolio: 'portfolio',
  "own|projects' deals (read)": 'own_projects_deals_read',
  'portfolio|deals (read)': 'portfolio_deals_read',
  'own|captures until triage': 'own_captures_until_triage',
  'all|Read (results)': 'read_results',
  'own|(read-only)': 'own_read_only',
  'own|projects': 'own_projects',
  'assigned|job only': 'assigned_job_only',
  'all|(money scope)': 'all_money_scope',
  "own|projects' field work": 'own_projects_field_work',
};

/** One row as a preset holds it: the row, and the person's part of its scope when it has one. */
export interface ReferenceLine {
  readonly row: ReferenceRow;
  readonly scope: ReferenceScope | null;
}

/** What one preset can and cannot do, each list in F2's order. */
export interface RoleReference {
  readonly can: readonly ReferenceLine[];
  readonly cant: readonly ReferenceLine[];
}

export function roleReference(preset: RolePreset): RoleReference {
  const can: ReferenceLine[] = [];
  const cant: ReferenceLine[] = [];
  for (const row of REFERENCE_ROWS) {
    const held = heldScope(row, preset);
    if (held === undefined) cant.push({ row, scope: null });
    else can.push({ row, scope: held });
  }
  return { can, cant };
}

/** The scope a preset holds a row under: `null` for a plain grant, `undefined` when not held. */
function heldScope(row: ReferenceRow, preset: RolePreset): ReferenceScope | null | undefined {
  if (row in CAPABILITY_MATRIX) {
    const grant = CAPABILITY_MATRIX[row as Capability].grants[preset];
    if (!grant.held) return undefined;
    return 'limitedTo' in grant ? limitScope(grant.limitedTo) : null;
  }
  /* Every non-capability row is a visibility row (`REFERENCE_ROWS`' test holds it). */
  const cell = (VISIBILITY_MATRIX as Record<VisibilityDomain, VisibilityRow>)[
    row as VisibilityDomain
  ].cells[preset];
  return cell.scope === 'none' ? undefined : visibilityScope(cell);
}

/**
 * A capability cell's phrase as a scope — `null` for a phrase that is only a PRD rule id. A phrase
 * with no word here is a matrix change the screen cannot say yet, and stops the read.
 */
export function limitScope(phrase: string): ReferenceScope | null {
  if (!(phrase in LIMIT_SCOPE)) throw new Error(`No Roles reference scope for "${phrase}"`);
  return LIMIT_SCOPE[phrase] ?? null;
}

/** A visibility cell's scope word and qualifier as a scope; an unknown one stops the read. */
export function visibilityScope(cell: VisibilityCell): ReferenceScope {
  const key = cell.qualifier === undefined ? cell.scope : `${cell.scope}|${cell.qualifier}`;
  const scope = VISIBILITY_SCOPE[key];
  if (scope === undefined) throw new Error(`No Roles reference scope for "${key}"`);
  return scope;
}
