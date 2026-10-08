import type { RolePreset } from '@heliogrid/contracts';
import type {
  CentreVerb,
  ComposedHome,
  FirstRunMark,
  ShellDoor,
  StandingDestination,
  StorePlatform,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { homeTitle } from './homes';
import { SIGN_IN } from './sign-in';

/**
 * Every word the shell shows (`SCR-SHELL-01`), authored once for both platforms (Law 11)
 * in three languages (`F3-07`). The export's frames are the source; where they name a person
 * the shell cannot read yet (the manager) or a control with nothing behind it ("Contact your
 * admin"), `T-SHELL-001` records the change. Values in braces are the screen's to fill.
 */
export const SHELL = {
  search: /*i18n*/ { id: 'Search' },
  /** The web header's search box (`SCR-SHELL-02`'s words): what a search finds, never invoices (`F6-20`). */
  searchPlaceholder: /*i18n*/ { id: 'Name, phone or city' },
  /** The web rail's landmark name; a screen reader adds "navigation" itself. */
  mainNavigation: /*i18n*/ { id: 'Main' },
  notifications: /*i18n*/ { id: 'Notifications' },
  account: /*i18n*/ { id: 'Account' },
  accountOf: /*i18n*/ { id: '{name} — account, grievance contact and sign out' },
  grievanceOfficer: /*i18n*/ { id: 'Grievance officer' },
  signOut: /*i18n*/ { id: 'Sign out' },
  notPublishedYet: /*i18n*/ { id: 'Not published yet' },
  grievanceNotPublished: /*i18n*/ {
    id: 'Your company has not published its grievance officer yet. Ask your admin who handles questions about your data.',
  },
  switchHome: /*i18n*/ { id: 'Switch home' },
  switchFrom: /*i18n*/ { id: '{home}, switch home' },
  onlyPreset: /*i18n*/ { id: '{preset} home · your only preset' },
  alsoHolding: /*i18n*/ { id: '{preset} home · you also hold {others}' },
  highestPreset: /*i18n*/ { id: '{preset} home · {highest} is your highest preset' },
  nothingAssigned: /*i18n*/ { id: 'Nothing assigned to you yet' },
  workShowsHere: /*i18n*/ {
    id: 'Work assigned to you shows here. Ask your manager for your first one.',
  },
  couldNotLoad: /*i18n*/ { id: "Couldn't load your work" },
  keepsFailing: /*i18n*/ {
    id: 'Try again. If it keeps failing, tell your admin what you were doing.',
  },
  tryAgain: SIGN_IN.tryAgain,
  gotIt: /*i18n*/ { id: 'Got it' },
  /** An overlay's close button: a name a screen reader speaks, never drawn. */
  close: /*i18n*/ { id: 'Close' },
  next: /*i18n*/ { id: 'Next' },
  markCount: /*i18n*/ { id: '{step} of {total}' },
  accessRemovedFrom: /*i18n*/ { id: 'Your access to {company} was removed' },
  accessRemoved: /*i18n*/ { id: 'Your access was removed' },
  nothingLost: /*i18n*/ {
    id: 'Nothing you captured on this device is lost. Ask your admin to restore your access, or sign in with another account.',
  },
  signInWithAnother: /*i18n*/ { id: 'Sign in with another account' },
  comingLater: /*i18n*/ { id: 'This screen arrives in a later update.' },
  today: /*i18n*/ { id: 'Today · {date}' },
  updateRequired: /*i18n*/ { id: 'Update HelioGrid' },
  updateVersions: /*i18n*/ {
    id: 'This is version {current}. HelioGrid now needs version {required} or later.',
  },
} as const;

/** The twelve presets by name — the switcher's second line and a composed block's overline. */
const PRESET_NAME: Record<RolePreset, { id: string }> = {
  epc_owner: /*i18n*/ { id: 'EPC Owner' },
  sales_manager: /*i18n*/ { id: 'Sales Manager' },
  operations: /*i18n*/ { id: 'Operations' },
  project_manager: /*i18n*/ { id: 'Project Manager' },
  marketing: /*i18n*/ { id: 'Marketing' },
  finance: /*i18n*/ { id: 'Finance' },
  hr_admin: /*i18n*/ { id: 'HR/Admin' },
  sales_executive: /*i18n*/ { id: 'Sales Executive' },
  design_engineer: /*i18n*/ { id: 'Design Engineer' },
  survey_engineer: /*i18n*/ { id: 'Survey Engineer' },
  field_technician: /*i18n*/ { id: 'Field Technician' },
  installation_team_member: /*i18n*/ { id: 'Installation Team Member' },
};

/** Each pill item's name — shown on the item in view, read aloud on every other. */
const DESTINATION_LABEL: Record<StandingDestination, { id: string }> = {
  home: /*i18n*/ { id: 'Home' },
  leads: /*i18n*/ { id: 'Leads' },
  proposals: /*i18n*/ { id: 'Proposals' },
  projects: /*i18n*/ { id: 'Projects' },
  people: /*i18n*/ { id: 'People' },
  campaigns: /*i18n*/ { id: 'Campaigns' },
  more: /*i18n*/ { id: 'More' },
};

/** The update-required screen's one button, named for the store this phone updates from (`F4-36`). */
const UPDATE_ON_STORE: Record<StorePlatform, { id: string }> = {
  ios: /*i18n*/ { id: 'Update on the App Store' },
  android: /*i18n*/ { id: 'Update on Google Play' },
};

/** The add action's name: the verb it performs (`F7-22`). */
const VERB_LABEL: Record<CentreVerb, { id: string }> = {
  add_lead: /*i18n*/ { id: 'Add lead' },
  start_survey: /*i18n*/ { id: 'Start survey' },
};

/** The add action's coach mark, one whole sentence pair per verb. */
const VERB_MARK: Record<CentreVerb, { title: { id: string }; body: { id: string } }> = {
  add_lead: {
    title: /*i18n*/ { id: 'Add a lead from your home' },
    body: /*i18n*/ { id: 'Use this button to add a lead.' },
  },
  start_survey: {
    title: /*i18n*/ { id: 'Start a survey from your home' },
    body: /*i18n*/ { id: 'Use this button to start a survey.' },
  },
};

const SWITCH_MARK = {
  title: /*i18n*/ { id: 'Two presets, one home' },
  body: /*i18n*/ { id: 'Your home is the {preset} one. Open the title to switch.' },
};

export function presetName(translate: Translator['t'], preset: RolePreset): string {
  return translate(PRESET_NAME[preset]);
}

export function destinationLabel(
  translate: Translator['t'],
  destination: StandingDestination,
): string {
  return translate(DESTINATION_LABEL[destination]);
}

export function updateOnStoreLabel(translate: Translator['t'], store: StorePlatform): string {
  return translate(UPDATE_ON_STORE[store]);
}

export function verbLabel(translate: Translator['t'], verb: CentreVerb): string {
  return translate(VERB_LABEL[verb]);
}

/**
 * The run's own words (`M01-16`): the counter, and the forward button, which closes the run on the
 * last mark — so "Next" never offers a mark that is not there. The dismiss is always "Got it".
 */
export function firstRunMarkLabels(
  translate: Translator['t'],
  { step, total }: { step: number; total: number },
) {
  const done = translate(SHELL.gotIt);
  return {
    counterLabel: translate(SHELL.markCount, { step, total }),
    nextLabel: step < total ? translate(SHELL.next) : done,
    dismissLabel: done,
  };
}

/**
 * A mark's words name its own control (`SCR-SHELL-01` Frame 7): the switcher's names the home in
 * force, the add action's what it does. They are true on both platforms — the desktop's verb
 * button sits on the home only, so no mark says "every screen", and none says "tap". The action's
 * mark is listed only with a verb (`firstRunMarksFor`), so a null verb has no words.
 */
export function firstRunMarkWords(
  translate: Translator['t'],
  mark: FirstRunMark,
  home: RolePreset,
  verb: CentreVerb | null,
): { title: string; body: string } | null {
  if (mark === 'switch-home') {
    const preset = presetName(translate, home);
    return { title: translate(SWITCH_MARK.title), body: translate(SWITCH_MARK.body, { preset }) };
  }
  if (verb === null) return null;
  return { title: translate(VERB_MARK[verb].title), body: translate(VERB_MARK[verb].body) };
}

/**
 * Frame 8's words (`S1.wrong.4`): the company by name, or plainly when its name never loaded; the
 * one way on; the grievance contact.
 */
export function accessRemovedWords(translate: Translator['t'], company: string | null) {
  return {
    title:
      company === null
        ? translate(SHELL.accessRemoved)
        : translate(SHELL.accessRemovedFrom, { company }),
    description: translate(SHELL.nothingLost),
    actionLabel: translate(SHELL.signInWithAnother),
    grievanceLabel: translate(SHELL.grievanceOfficer),
  };
}

/** The avatar's menu words: whose account it opens, and its two items. */
export function accountMenuWords(translate: Translator['t'], name: string) {
  return {
    triggerName: translate(SHELL.accountOf, { name }),
    menuLabel: translate(SHELL.account),
    grievanceLabel: translate(SHELL.grievanceOfficer),
    signOutLabel: translate(SHELL.signOut),
  };
}

/**
 * The home head's words (`M13-10`): the title in force, which is the switcher, and each held
 * preset's home with its preset beside it — two presets share "My Day" — the one in force ticked.
 */
export function homeHeadWords(
  translate: Translator['t'],
  home: RolePreset,
  homes: readonly RolePreset[],
) {
  const title = homeTitle(translate, home);
  return {
    title,
    switchName: translate(SHELL.switchFrom, { home: title }),
    switchLabel: translate(SHELL.switchHome),
    presetLine: presetLine(translate, home, homes),
    entries: homes.map((preset) => ({
      preset,
      label: homeTitle(translate, preset),
      meta: presetName(translate, preset),
      selected: preset === home,
    })),
  };
}

/**
 * The home's blocks and their words (`M13-10`, `M01-17`): one for the home's own work and one per
 * composed preset, each overlined with its preset; the teaching and failing words are every block's.
 */
export function homeBlocksWords(translate: Translator['t'], home: ComposedHome) {
  return {
    blocks: [home.home, ...home.composed].map((preset) => ({
      key: preset,
      overline: presetName(translate, preset),
    })),
    emptyTitle: translate(SHELL.nothingAssigned),
    emptyMessage: translate(SHELL.workShowsHere),
    errorTitle: translate(SHELL.couldNotLoad),
    errorMessage: translate(SHELL.keepsFailing),
    retryLabel: translate(SHELL.tryAgain),
  };
}

/** A door's title — the screen it opens is named for what it is, until its module draws it. */
export function doorTitle(translate: Translator['t'], door: ShellDoor): string {
  if (door === 'add_lead' || door === 'start_survey') return verbLabel(translate, door);
  if (door === 'search') return translate(SHELL.search);
  return destinationLabel(translate, door);
}

/** The line over the home's title; `date` is today, already in the market's style. */
export function todayLine(translate: Translator['t'], date: string): string {
  return translate(SHELL.today, { date });
}

/**
 * The line under the home's title: which preset's home this is, and what else the person holds
 * or which preset ranks highest (`M13-10`). The other presets are listed with commas, never an
 * "and": Hermes ships no list formatter, and a comma reads the same in all three languages.
 */
export function presetLine(
  translate: Translator['t'],
  home: RolePreset,
  held: readonly RolePreset[],
): string {
  const preset = presetName(translate, home);
  const [highest] = held;
  if (held.length <= 1) return translate(SHELL.onlyPreset, { preset });
  if (highest !== undefined && highest !== home) {
    return translate(SHELL.highestPreset, { preset, highest: presetName(translate, highest) });
  }
  const others = held
    .filter((other) => other !== home)
    .map((other) => presetName(translate, other))
    .join(', ');
  return translate(SHELL.alsoHolding, { preset, others });
}
