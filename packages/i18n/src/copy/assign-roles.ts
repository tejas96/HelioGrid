/**
 * The words of Assign Roles (`SCR-M01-13`, `M01-20`) — authored once for both platforms (Law 11).
 * The grant line is one whole sentence per language with a `{name}` and a `{list}` slot, so a
 * translator places the verb: Hindi and Marathi put it after the list. Each preset supplies one
 * clause; the respectful plural of the verb marks no gender.
 */

import type { PresetLock, RolePreset, SaveRolesOff, TeamRowStatus } from '@heliogrid/domain';
import { firstNameOf, grantLine, ROLE_PRESETS } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { fillSlots, joinParts, slotMark, type TextPart } from './list-join';
import { presetAbility } from './role-presets';
import { presetName, SHELL } from './shell';
import { teamStatusWord } from './team';

export const ASSIGN_ROLES = {
  overline: /*i18n*/ { id: 'Assign roles' },
  presets: /*i18n*/ { id: 'Presets' },
  recorded: /*i18n*/ { id: 'Every change is recorded under your name — roles before and after.' },
  gives: /*i18n*/ { id: 'What this gives them' },
  sentence: /*i18n*/ { id: '{name} can {list}.' },
  none: /*i18n*/ { id: '{name} would hold no presets.' },
  save: /*i18n*/ { id: 'Save roles' },
  unchanged: /*i18n*/ { id: 'Tick or clear a preset first.' },
  empty: /*i18n*/ { id: 'Tick at least one preset.' },
  soleOwner: /*i18n*/ {
    id: '{company} must keep one EPC Owner, so make someone else one first.',
  },
  ownAdmin: /*i18n*/ { id: "You can't remove your own EPC Owner — another EPC Owner can." },
  loading: /*i18n*/ { id: "Loading {name}'s presets" },
};

/** What each preset lets a person do, as the clause the grant line joins (the board's verbs). */
const PRESET_CLAUSE: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ { id: 'run the whole business' },
  sales_manager: /*i18n*/ { id: 'oversee sales' },
  sales_executive: /*i18n*/ { id: 'sell' },
  survey_engineer: /*i18n*/ { id: 'survey' },
  design_engineer: /*i18n*/ { id: 'design' },
  project_manager: /*i18n*/ { id: 'run projects' },
  field_technician: /*i18n*/ { id: 'work assigned stops' },
  installation_team_member: /*i18n*/ { id: 'install' },
  hr_admin: /*i18n*/ { id: 'handle people and admin' },
  finance: /*i18n*/ { id: 'handle money' },
  operations: /*i18n*/ { id: 'run operations' },
  marketing: /*i18n*/ { id: 'run marketing' },
};

const SAVE_OFF: Record<SaveRolesOff, { id: string }> = {
  unchanged: ASSIGN_ROLES.unchanged,
  empty: ASSIGN_ROLES.empty,
};

const LOCK_REASON: Record<PresetLock, { id: string }> = {
  'sole-owner': ASSIGN_ROLES.soleOwner,
  'own-admin': ASSIGN_ROLES.ownAdmin,
};

/** The grant line: the sentence in parts, each clause strong; `none` when no preset is held. */
export interface GrantLineWords {
  readonly parts: readonly TextPart[];
  readonly none: boolean;
}

/** `speakers` is `grantLine(…).speakers` — the presets that speak, in F2's order. */
export function grantLineWords(
  translate: Translator['t'],
  firstName: string,
  speakers: readonly RolePreset[],
): GrantLineWords {
  if (speakers.length === 0) {
    return {
      parts: [{ text: translate(ASSIGN_ROLES.none, { name: firstName }), strong: false }],
      none: true,
    };
  }
  const clauses = speakers.map((preset) => ({
    text: translate(PRESET_CLAUSE[preset]),
    strong: true,
  }));
  /* The name is a slot too, so nothing a person is called can be read as one. */
  const template = translate(ASSIGN_ROLES.sentence, { name: slotMark(1), list: slotMark(0) });
  return {
    parts: fillSlots(template, [
      joinParts(translate, clauses),
      [{ text: firstName, strong: false }],
    ]),
    none: false,
  };
}

/** One preset row: its name, what it can do, and why it is off, when it is. */
export interface AssignRolesPresetWords {
  readonly value: RolePreset;
  readonly title: string;
  readonly description: string;
  readonly lockReason: string | null;
}

export interface AssignRolesWords {
  readonly overline: string;
  readonly presets: string;
  readonly recorded: string;
  readonly gives: string;
  readonly save: string;
  /** Why *Save roles* is off (`saveRolesOff`), or null when it may run. */
  saveOff(off: SaveRolesOff | null): string | null;
  readonly close: string;
  readonly loading: string;
  /** The twelve presets in F2's order (`ROLE_PRESETS`). */
  readonly rows: readonly AssignRolesPresetWords[];
}

export interface AssignRolesFacts {
  readonly firstName: string;
  readonly companyName: string;
  readonly locks: Partial<Record<RolePreset, PresetLock>>;
}

export function assignRolesWords(
  translate: Translator['t'],
  facts: AssignRolesFacts,
): AssignRolesWords {
  const lockReason = (preset: RolePreset) => {
    const lock = facts.locks[preset];
    return lock === undefined ? null : translate(LOCK_REASON[lock], { company: facts.companyName });
  };
  return {
    overline: translate(ASSIGN_ROLES.overline),
    presets: translate(ASSIGN_ROLES.presets),
    recorded: translate(ASSIGN_ROLES.recorded),
    gives: translate(ASSIGN_ROLES.gives),
    save: translate(ASSIGN_ROLES.save),
    saveOff: (off) => (off === null ? null : translate(SAVE_OFF[off])),
    close: translate(SHELL.close),
    loading: translate(ASSIGN_ROLES.loading, { name: facts.firstName }),
    rows: ROLE_PRESETS.map((preset) => ({
      value: preset,
      title: presetName(translate, preset),
      description: presetAbility(translate, preset),
      lockReason: lockReason(preset),
    })),
  };
}

/** What the open editor shows, as both screens hand it to `AssignRoles`. */
export interface AssignRolesShown {
  readonly words: AssignRolesWords;
  readonly status: string;
  readonly grant: { readonly speakers: readonly RolePreset[]; readonly parts: readonly TextPart[] };
  readonly saveOffReason: string | null;
}

export interface AssignRolesOpen {
  readonly name: string;
  readonly status: TeamRowStatus;
  readonly companyName: string;
  readonly picked: readonly RolePreset[];
  readonly locks: Partial<Record<RolePreset, PresetLock>>;
  readonly saveOff: SaveRolesOff | null;
}

/** The editor's words for one person and their ticks: the rows, the status, the grant line, Save's reason. */
export function assignRolesShown(
  translate: Translator['t'],
  open: AssignRolesOpen,
): AssignRolesShown {
  const firstName = firstNameOf(open.name);
  const words = assignRolesWords(translate, {
    firstName,
    companyName: open.companyName,
    locks: open.locks,
  });
  const { speakers } = grantLine(open.picked);
  return {
    words,
    status: teamStatusWord(translate, open.status),
    grant: { speakers, parts: grantLineWords(translate, firstName, speakers).parts },
    saveOffReason: words.saveOff(open.saveOff),
  };
}
