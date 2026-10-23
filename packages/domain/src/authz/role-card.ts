import { CAPABILITY_MATRIX, type Capability } from './capabilities';
import { can, visibilityIn } from './policy';
import { inMatrixOrder, type RolePreset } from './roles';

/**
 * The role card (`SCR-M01-10`, `M01-15`): what a person's held presets let them do and what they
 * do not, as closed lines both platforms render (Law 11). Every line is decided by the matrix,
 * so the card can never claim a grant `can` refuses, and a limit one held preset lifts is no
 * limit (brief ruling 4). The words are `packages/i18n`'s, keyed by the line.
 */

/**
 * What decides a line. A `row` names its matrix row; a `limited(…)` cell there grants the line
 * or denies it, written per line, because a cell's phrase is a narrower act the card cannot
 * print. `leads` reads the leads visibility; `preset` is the one line no row carries (the Field
 * Technician's own work, F2 §F2.1).
 */
export type RoleCardDecider =
  | { readonly kind: 'row'; readonly row: Capability; readonly limited: 'grants' | 'denies' }
  | { readonly kind: 'leads'; readonly reach: 'own' | 'campaigns' | 'team' | 'all' }
  | { readonly kind: 'preset'; readonly preset: RolePreset };

const row = (capability: Capability, limited: 'grants' | 'denies' = 'denies') =>
  ({ kind: 'row', row: capability, limited }) as const;
const leads = (reach: 'own' | 'campaigns' | 'team' | 'all') => ({ kind: 'leads', reach }) as const;

/** Every line the card can draw, in the order it draws them. */
export const ROLE_CARD_LINES = [
  { key: 'leads_own', decidedBy: leads('own') },
  { key: 'leads_campaigns', decidedBy: leads('campaigns') },
  { key: 'leads_team', decidedBy: leads('team') },
  { key: 'leads_all', decidedBy: leads('all') },
  { key: 'own_work', decidedBy: { kind: 'preset', preset: 'field_technician' } },
  { key: 'leads_edit', decidedBy: row('crm.add_edit_leads') },
  { key: 'site_survey', decidedBy: row('survey.capture_surveys', 'grants') },
  { key: 'proposals_edit', decidedBy: row('proposals.create_edit_proposals') },
  { key: 'proposals_send', decidedBy: row('proposals.send_proposals') },
  { key: 'won_lost', decidedBy: row('sales.mark_won_lost') },
  { key: 'designs_edit', decidedBy: row('studio.create_edit_designs') },
  { key: 'designs_approve', decidedBy: row('studio.approve_designs') },
  { key: 'campaigns_run', decidedBy: row('marketing.manage_campaigns') },
  { key: 'leads_assign', decidedBy: row('crm.assign_leads') },
  { key: 'leads_delete', decidedBy: row('crm.delete_leads') },
  { key: 'stages_update', decidedBy: row('projects.update_stages') },
  { key: 'project_documents', decidedBy: row('projects.project_documents') },
  { key: 'installation_checklist', decidedBy: row('projects.installation_checklist', 'grants') },
  { key: 'payments_record', decidedBy: row('payments.record_payments') },
  { key: 'tranche_waive', decidedBy: row('payments.waive_tranche') },
  { key: 'leave_decide', decidedBy: row('hr.decide_leave') },
  { key: 'reports_company', decidedBy: row('reports.company_reports', 'grants') },
  { key: 'price_list', decidedBy: row('onboarding.manage_catalog') },
  { key: 'agent_setup', decidedBy: row('onboarding.configure_agent') },
  { key: 'company_settings', decidedBy: row('onboarding.manage_tenant_settings') },
  { key: 'plan_billing', decidedBy: row('billing.manage_billing') },
] as const satisfies readonly { readonly key: string; readonly decidedBy: RoleCardDecider }[];

export type RoleCardLineKey = (typeof ROLE_CARD_LINES)[number]['key'];

/**
 * What each preset is told it cannot do — F2's *Not theirs* text for the preset, as lines. The
 * Sales Executive's adds company settings: the locked board draws it, and F2 names company
 * settings as not the Sales Manager's either. A line here shows only while no held preset
 * holds it.
 */
export const ROLE_CARD_LIMITS = {
  epc_owner: [],
  sales_manager: ['leads_delete', 'price_list', 'agent_setup', 'company_settings', 'plan_billing'],
  sales_executive: [
    'leads_assign',
    'leads_delete',
    'stages_update',
    'payments_record',
    'reports_company',
    'company_settings',
  ],
  survey_engineer: ['leads_edit', 'proposals_edit', 'stages_update', 'payments_record'],
  design_engineer: [
    'leads_assign',
    'proposals_send',
    'stages_update',
    'payments_record',
    'company_settings',
  ],
  project_manager: ['proposals_send', 'price_list', 'agent_setup', 'plan_billing'],
  field_technician: ['leads_edit', 'proposals_edit', 'payments_record'],
  installation_team_member: ['leads_edit', 'proposals_edit', 'stages_update', 'payments_record'],
  hr_admin: ['leads_edit', 'proposals_edit', 'designs_edit', 'payments_record'],
  finance: ['proposals_edit', 'stages_update', 'price_list', 'plan_billing'],
  operations: ['agent_setup', 'payments_record', 'plan_billing'],
  marketing: ['leads_edit', 'leads_assign', 'proposals_edit'],
} as const satisfies Readonly<Record<RolePreset, readonly RoleCardLineKey[]>>;

/** The owners the card's note names before it counts the rest (`SCR-M01-10` ruling 15). */
export const ROLE_CARD_OWNERS_SHOWN = 2;

export interface RoleCard {
  /** The held presets, each once, in matrix order — the card's name line. */
  readonly presets: readonly RolePreset[];
  readonly grants: readonly RoleCardLineKey[];
  readonly limits: readonly RoleCardLineKey[];
  /** The person cannot add a teammate, so the card names who can (brief ruling 8). */
  readonly ownerNote: boolean;
}

export function roleCard(roles: readonly RolePreset[]): RoleCard {
  const presets = inMatrixOrder(roles);
  const grants = ROLE_CARD_LINES.filter((line) => holds(presets, line.decidedBy));
  const listed = new Set<RoleCardLineKey>(presets.flatMap((preset) => ROLE_CARD_LIMITS[preset]));
  const limits = ROLE_CARD_LINES.filter((line) => listed.has(line.key) && !grants.includes(line));
  return {
    presets,
    grants: grants.map((line) => line.key),
    limits: limits.map((line) => line.key),
    ownerNote: !can(presets, 'onboarding.manage_team'),
  };
}

function holds(presets: readonly RolePreset[], decider: RoleCardDecider): boolean {
  switch (decider.kind) {
    case 'preset':
      return presets.includes(decider.preset);
    case 'leads':
      return reachesLeads(presets, decider.reach);
    case 'row':
      return presets.some((preset) => {
        const cell = CAPABILITY_MATRIX[decider.row].grants[preset];
        return cell.held && (!('limitedTo' in cell) || decider.limited === 'grants');
      });
  }
}

/** Marketing's own leads are its campaigns' captures (`crm.ts`), so they read apart. */
function reachesLeads(
  presets: readonly RolePreset[],
  reach: 'own' | 'campaigns' | 'team' | 'all',
): boolean {
  const { scope, grantedBy } = visibilityIn(presets, 'leads');
  const capturesOnly = grantedBy.every((preset) => preset === 'marketing');
  if (reach === 'own') return scope === 'own' && !capturesOnly;
  if (reach === 'campaigns') return scope === 'own' && capturesOnly;
  return scope === reach;
}
