import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The words of the role card (`SCR-M01-10`) for the lines `roleCard` decides — authored once for
 * both lives and both platforms (Law 11). Lists join with a per-language *and* or *or* message:
 * Hermes ships no list formatter (`presetLine`, `shell.ts`).
 */

import {
  homesOf,
  type RoleCard,
  type RoleCardLineKey,
  type RoleCardNames,
  type RolePreset,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { homeTitle } from './homes';
import { joinAnd } from './list-join';
import { PROFILE_PREFERENCES } from './profile-preferences';
import { presetName, SHELL } from './shell';

export const ROLE_CARD = {
  titleOne: /*i18n*/ { id: 'Your role at {company}' },
  titleMany: /*i18n*/ { id: 'Your roles at {company}' },
  credit: /*i18n*/ { id: 'Last set by {name}' },
  canDo: /*i18n*/ { id: 'What you can do' },
  cannotDo: /*i18n*/ { id: 'What you cannot do' },
  region: /*i18n*/ { id: 'What you can and cannot do' },
  loading: /*i18n*/ { id: 'Loading what your role can and cannot do' },
  ownerOne: /*i18n*/ { id: '{name} (owner)' },
  ownersTwo: /*i18n*/ { id: '{first} or {second} (owners)' },
  ownersMore: /*i18n*/ { id: '{first}, {second} or {more} more (owners)' },
  noteTitle: /*i18n*/ { id: 'Only {holder} can add a teammate.' },
  noteMessage: /*i18n*/ { id: 'Ask them when you need one.' },
  reopen: /*i18n*/ { id: 'Reopen anytime from Profile & preferences.' },
  errorTitle: /*i18n*/ { id: "We couldn't load your role" },
  errorAsk: /*i18n*/ { id: 'You are still part of {company}. Try again, or ask {name} to check.' },
  errorWait: /*i18n*/ { id: 'You are still part of {company}. Try again in a moment.' },
  errorPlain: /*i18n*/ { id: 'Your role has not changed. Try again in a moment.' },
  retry: /*i18n*/ { id: 'Try again' },
};

const ROLE_CARD_LINE: Record<RoleCardLineKey, { id: string }> = {
  leads_own: /*i18n*/ { id: 'See your own leads and follow-ups' },
  leads_campaigns: /*i18n*/ { id: 'See the leads your campaigns bring in' },
  leads_team: /*i18n*/ { id: "See your team's leads and follow-ups" },
  leads_all: /*i18n*/ { id: 'See every lead and follow-up' },
  own_work: /*i18n*/ { id: 'See your own stops, check-ins and attendance' },
  leads_edit: /*i18n*/ { id: 'Add and edit leads' },
  site_survey: /*i18n*/ { id: 'Survey a site' },
  proposals_edit: /*i18n*/ { id: 'Build and edit proposals, discounts included' },
  proposals_send: /*i18n*/ { id: 'Send proposals to customers' },
  won_lost: /*i18n*/ { id: 'Mark a lead won or lost' },
  designs_edit: /*i18n*/ { id: 'Create and edit designs' },
  designs_approve: /*i18n*/ { id: 'Approve designs or send them back' },
  campaigns_run: /*i18n*/ { id: 'Create and run campaigns' },
  leads_assign: /*i18n*/ { id: 'Assign leads to others' },
  leads_delete: /*i18n*/ { id: 'Delete leads' },
  stages_update: /*i18n*/ { id: 'Update project stages' },
  project_documents: /*i18n*/ { id: 'Upload and check project documents' },
  installation_checklist: /*i18n*/ { id: 'Run the installation checklist' },
  payments_record: /*i18n*/ { id: 'Record payments' },
  tranche_waive: /*i18n*/ { id: 'Waive a payment stage' },
  leave_decide: /*i18n*/ { id: 'Approve leave' },
  reports_company: /*i18n*/ { id: 'See reports beyond your own' },
  price_list: /*i18n*/ { id: 'Change the price list' },
  agent_setup: /*i18n*/ { id: 'Set up the calling agent' },
  company_settings: /*i18n*/ { id: 'Change company settings' },
  plan_billing: /*i18n*/ { id: 'Manage the plan and billing' },
};

/** The first-run act, named for the home it opens (brief ruling 2) — never *Continue*. */
const ROLE_CARD_ACT: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ { id: 'Go to the dashboard' },
  sales_manager: /*i18n*/ { id: 'Go to the dashboard' },
  operations: /*i18n*/ { id: 'Go to operations' },
  project_manager: /*i18n*/ { id: 'Go to the project board' },
  marketing: /*i18n*/ { id: 'Go to campaigns' },
  finance: /*i18n*/ { id: 'Go to finance' },
  hr_admin: /*i18n*/ { id: 'Go to people today' },
  sales_executive: /*i18n*/ { id: 'Go to my day' },
  design_engineer: /*i18n*/ { id: 'Go to the design queue' },
  survey_engineer: /*i18n*/ { id: 'Go to my visits' },
  field_technician: /*i18n*/ { id: 'Go to my day' },
  installation_team_member: /*i18n*/ { id: 'Go to my job' },
};

/** The line at the act when a second home waits in the switcher (brief ruling 13). */
const ROLE_CARD_NEXT_HOME: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ { id: 'Your dashboard is one switch away.' },
  sales_manager: /*i18n*/ { id: 'Your dashboard is one switch away.' },
  operations: /*i18n*/ { id: 'Your operations view is one switch away.' },
  project_manager: /*i18n*/ { id: 'Your projects are one switch away.' },
  marketing: /*i18n*/ { id: 'Your campaigns are one switch away.' },
  finance: /*i18n*/ { id: 'Your money view is one switch away.' },
  hr_admin: /*i18n*/ { id: 'Your people view is one switch away.' },
  sales_executive: /*i18n*/ { id: 'Your day is one switch away.' },
  design_engineer: /*i18n*/ { id: 'Your designs are one switch away.' },
  survey_engineer: /*i18n*/ { id: 'Your visits are one switch away.' },
  field_technician: /*i18n*/ { id: 'Your day is one switch away.' },
  installation_team_member: /*i18n*/ { id: 'Your job is one switch away.' },
};

export interface RoleCardLineWords {
  readonly key: RoleCardLineKey;
  readonly text: TranslatedText;
}

export interface RoleCardWords {
  readonly title: TranslatedText;
  /** The reopened life's sheet and panel title. */
  readonly surfaceTitle: TranslatedText;
  readonly presets: TranslatedText;
  readonly credit: TranslatedText | null;
  readonly canDo: TranslatedText;
  readonly cannotDo: TranslatedText;
  readonly region: TranslatedText;
  readonly loading: TranslatedText;
  readonly grants: readonly RoleCardLineWords[];
  readonly limits: readonly RoleCardLineWords[];
  /** `null` when the person adds teammates themself, or no owner name has arrived. */
  readonly note: { readonly title: TranslatedText; readonly message: TranslatedText } | null;
  readonly act: TranslatedText;
  readonly atAct: TranslatedText;
  readonly error: {
    readonly title: TranslatedText;
    readonly body: TranslatedText;
    readonly retry: TranslatedText;
  };
}

export function roleCardWords(
  translate: Translator['t'],
  card: RoleCard,
  facts: RoleCardNames,
): RoleCardWords {
  const many = card.presets.length > 1;
  const line = (key: RoleCardLineKey) => ({ key, text: translate(ROLE_CARD_LINE[key]) });
  const [home, next] = homesOf(card.presets);
  const holder = facts.owners && ownersHolder(translate, facts.owners);
  return {
    title:
      facts.companyName === null
        ? translate(many ? PROFILE_PREFERENCES.yourRoles : PROFILE_PREFERENCES.yourRole)
        : translate(many ? ROLE_CARD.titleMany : ROLE_CARD.titleOne, {
            company: facts.companyName,
          }),
    surfaceTitle: translate(many ? PROFILE_PREFERENCES.yourRoles : PROFILE_PREFERENCES.yourRole),
    presets: joinAnd(
      translate,
      card.presets.map((preset) => presetName(translate, preset)),
    ),
    credit:
      facts.setterName === null ? null : translate(ROLE_CARD.credit, { name: facts.setterName }),
    canDo: translate(ROLE_CARD.canDo),
    cannotDo: translate(ROLE_CARD.cannotDo),
    region: translate(ROLE_CARD.region),
    loading: translate(ROLE_CARD.loading),
    grants: card.grants.map(line),
    limits: card.limits.map(line),
    note:
      card.ownerNote && holder
        ? {
            title: translate(ROLE_CARD.noteTitle, { holder }),
            message: translate(ROLE_CARD.noteMessage),
          }
        : null,
    act: home === undefined ? translate(SHELL.goToHome) : translate(ROLE_CARD_ACT[home]),
    atAct:
      home !== undefined &&
      next !== undefined &&
      homeTitle(translate, next) !== homeTitle(translate, home)
        ? translate(ROLE_CARD_NEXT_HOME[next])
        : translate(ROLE_CARD.reopen),
    error: {
      title: translate(ROLE_CARD.errorTitle),
      body: errorBody(translate, facts),
      retry: translate(ROLE_CARD.retry),
    },
  };
}

function ownersHolder(
  translate: Translator['t'],
  owners: NonNullable<RoleCardNames['owners']>,
): TranslatedText | null {
  const [first, second] = owners.names;
  if (first === undefined) return null;
  if (second === undefined) return translate(ROLE_CARD.ownerOne, { name: first });
  if (owners.more === 0) return translate(ROLE_CARD.ownersTwo, { first, second });
  return translate(ROLE_CARD.ownersMore, { first, second, more: owners.more });
}

function errorBody(translate: Translator['t'], facts: RoleCardNames): TranslatedText {
  const { companyName: company, setterName: name } = facts;
  if (company === null) return translate(ROLE_CARD.errorPlain);
  if (name === null) return translate(ROLE_CARD.errorWait, { company });
  return translate(ROLE_CARD.errorAsk, { company, name });
}
