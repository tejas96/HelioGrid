import type { Capability } from '../authz/capabilities';
import type { RolePreset } from '../authz/roles';

/**
 * The acts the shell offers: the one in the middle of the footer pill (`F7-22`) and the one on the
 * home's own button. A screen renders a KEY and the glyph never changes; the words are
 * `packages/i18n`'s. Adding a verb here is not enough — it needs the capability it performs below,
 * and a home to carry it.
 */
export const CENTRE_VERBS = ['add_lead', 'proposals', 'start_survey'] as const;
export type CentreVerb = (typeof CENTRE_VERBS)[number];

/**
 * The capability each verb performs. The centre "never exposes an action the person's presets
 * do not permit" (`F7` §F7.3): `tests/shell/centre-verb.test.ts` holds every home's cell to
 * this through `can`, so a verb cannot be handed to a preset the matrix denies it.
 */
export const CENTRE_VERB_REQUIRES = {
  add_lead: 'crm.add_edit_leads',
  proposals: 'proposals.create_edit_proposals',
  start_survey: 'survey.capture_surveys',
} as const satisfies Record<CentreVerb, Capability>;

/**
 * The verb follows the HOME IN FORCE (`SCR-SHELL-01` decision 6), so the key is the preset whose
 * home is showing — the ladder's top preset or the switcher's choice (`M13-10`), never the set
 * of held presets. A cell is the PRD's or `null`: `null` is a home the PRD names no act for,
 * filled by that home's own task when it lands (Law 9) — never a default and never a guess.
 * Every preset is written out, so a thirteenth is a compile error here, not a quiet `undefined`.
 * The owner's centre opens the proposals list, where a proposal is started (`F7-48`); the owner's
 * lead is added from the Leads list and from the home's own button (`homeVerbFor`).
 */
const CENTRE_VERB_BY_HOME = {
  epc_owner: 'proposals',
  sales_manager: 'add_lead',
  sales_executive: 'add_lead',
  survey_engineer: 'start_survey',
  design_engineer: null,
  project_manager: null,
  field_technician: null,
  installation_team_member: null,
  hr_admin: null,
  // Money is written only on a project's payments screen (`M11-52`): no act needs no project.
  finance: null,
  operations: null,
  marketing: null,
} as const satisfies Record<RolePreset, CentreVerb | null>;

/**
 * The act under the thumb while `homePreset`'s home is in force — `null` where none is named
 * yet.
 */
export function centreVerbFor(homePreset: RolePreset): CentreVerb | null {
  return CENTRE_VERB_BY_HOME[homePreset];
}

/**
 * The act on the home's own button. It is the centre's, save on a home whose centre opens the
 * proposals: that home keeps *Add lead* on its page, so a lead is still one tap from it.
 */
export function homeVerbFor(homePreset: RolePreset): CentreVerb | null {
  const centre = centreVerbFor(homePreset);
  return centre === 'proposals' ? 'add_lead' : centre;
}
