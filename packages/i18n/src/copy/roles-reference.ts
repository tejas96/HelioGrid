import type { ExplainerPagerWords } from '@heliogrid/domain';
import {
  ROLE_PRESETS,
  type RoleHolding,
  type RolePreset,
  roleReference,
  type UncountedHolder,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { explainerPagerWords } from './explainer';
import { REFERENCE_ROW, REFERENCE_SCOPE } from './role-matrix';
import { presetSummary } from './role-presets';
import { settingsRowName } from './settings';
import { presetName } from './shell';
import { teamStatusWord } from './team';

/** The Roles reference's words (`SCR-M01-14`, `M01-21`), chosen once for both apps (Law 11). */
export const ROLES_REFERENCE = {
  lede: /*i18n*/ { id: 'Twelve fixed roles. Tap one to see what it can do.' },
  ledeWide: /*i18n*/ { id: 'Twelve fixed roles. Choose one to see what it can do.' },
  about: /*i18n*/ { id: 'About roles' },
  aboutFixed: /*i18n*/ {
    id: 'Roles can’t be created, renamed or deleted, so a role means the same for everyone. You give someone a role from their row in Team.',
  },
  aboutCounted: /*i18n*/ {
    id: 'Counts include active members only. Someone whose invite is still open, or who was deactivated, is named under the role but not counted.',
  },
  roles: /*i18n*/ { id: 'Roles' },
  people: /*i18n*/ { id: '{count, plural, one {# person} other {# people}}' },
  loadingCount: /*i18n*/ { id: 'Loading how many people hold {role}' },
  countGap: /*i18n*/ { id: 'Count unavailable' },
  countsFailed: /*i18n*/ { id: 'Holder counts didn’t load' },
  retry: /*i18n*/ { id: 'Try again' },
  nobody: /*i18n*/ { id: 'Nobody holds this yet' },
  show: /*i18n*/ { id: 'Show' },
  canTab: /*i18n*/ { id: 'Can do · {count}' },
  cantTab: /*i18n*/ { id: 'Can’t · {count}' },
  canList: /*i18n*/ { id: 'What {role} can do' },
  cantList: /*i18n*/ { id: 'What {role} can’t do' },
  close: /*i18n*/ { id: 'Close' },
  backToAssign: /*i18n*/ { id: 'Back to assign roles' },
} as const;

/** One row of a role's list: the row's words and, on a scoped grant, the person's part of it. */
export interface ReferenceLineWords {
  readonly key: string;
  readonly text: string;
  readonly scope: string | null;
}

/** Someone named under a role but not counted, with their status in words. */
export interface UncountedHolderWords extends UncountedHolder {
  readonly word: string;
}

/** One role as its tile and its details say it. */
export interface RoleReferenceWords {
  readonly value: RolePreset;
  readonly name: string;
  readonly summary: string;
  /** *2 people* — null while the counts are out or did not load. */
  readonly count: string | null;
  readonly loadingCount: string;
  /** The active holders' names, in the roster's order — empty when nobody holds it. */
  readonly holders: readonly string[];
  readonly others: readonly UncountedHolderWords[];
  readonly canTab: string;
  readonly cantTab: string;
  readonly canList: string;
  readonly cantList: string;
  readonly can: readonly ReferenceLineWords[];
  readonly cant: readonly ReferenceLineWords[];
}

export interface RolesReferenceWords {
  readonly title: string;
  readonly lede: string;
  readonly ledeWide: string;
  /** *About roles*: two pages and the pager's words. */
  readonly about: ExplainerPagerWords & {
    readonly label: string;
    readonly pages: readonly [string, string];
  };
  readonly roles: string;
  readonly countGap: string;
  readonly countsFailed: string;
  readonly retry: string;
  readonly nobody: string;
  readonly show: string;
  readonly close: string;
  readonly backToAssign: string;
  /** The twelve presets in F2's order (`ROLE_PRESETS`). */
  readonly presets: readonly RoleReferenceWords[];
}

/** `holdings` is `roleHolders(…)` once the roster is read, null before it is or when it failed. */
export function rolesReferenceWords(
  translate: Translator['t'],
  holdings: Readonly<Record<RolePreset, RoleHolding>> | null,
): RolesReferenceWords {
  return {
    title: settingsRowName(translate, 'roles'),
    lede: translate(ROLES_REFERENCE.lede),
    ledeWide: translate(ROLES_REFERENCE.ledeWide),
    about: {
      label: translate(ROLES_REFERENCE.about),
      pages: [translate(ROLES_REFERENCE.aboutFixed), translate(ROLES_REFERENCE.aboutCounted)],
      ...explainerPagerWords(translate),
    },
    roles: translate(ROLES_REFERENCE.roles),
    countGap: translate(ROLES_REFERENCE.countGap),
    countsFailed: translate(ROLES_REFERENCE.countsFailed),
    retry: translate(ROLES_REFERENCE.retry),
    nobody: translate(ROLES_REFERENCE.nobody),
    show: translate(ROLES_REFERENCE.show),
    close: translate(ROLES_REFERENCE.close),
    backToAssign: translate(ROLES_REFERENCE.backToAssign),
    presets: ROLE_PRESETS.map((preset) => presetWords(translate, preset, holdings?.[preset])),
  };
}

function presetWords(
  translate: Translator['t'],
  preset: RolePreset,
  holding: RoleHolding | undefined,
): RoleReferenceWords {
  const role = presetName(translate, preset);
  const { can, cant } = roleReference(preset);
  const line = ({ row, scope }: (typeof can)[number]): ReferenceLineWords => ({
    key: row,
    text: translate(REFERENCE_ROW[row]),
    scope: scope === null ? null : translate(REFERENCE_SCOPE[scope]),
  });
  return {
    value: preset,
    name: role,
    summary: presetSummary(translate, preset),
    count:
      holding === undefined ? null : translate(ROLES_REFERENCE.people, { count: holding.count }),
    loadingCount: translate(ROLES_REFERENCE.loadingCount, { role }),
    holders: holding?.holders ?? [],
    others: (holding?.others ?? []).map((other) => ({
      ...other,
      word: teamStatusWord(translate, other.status),
    })),
    canTab: translate(ROLES_REFERENCE.canTab, { count: can.length }),
    cantTab: translate(ROLES_REFERENCE.cantTab, { count: cant.length }),
    canList: translate(ROLES_REFERENCE.canList, { role }),
    cantList: translate(ROLES_REFERENCE.cantList, { role }),
    can: can.map(line),
    cant: cant.map(line),
  };
}
