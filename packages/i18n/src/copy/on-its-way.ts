import type { TranslatedText } from '@heliogrid/contracts';
import type { SettingsRow, ShellDoor } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { settingsRowName } from './settings';
import { doorTitle } from './shell';

/**
 * A page whose module has not landed (`F7-48`'s doors and the settings rows behind `More`): what it
 * will do, said plainly, with no figure or record it cannot show yet. A page here is every door
 * but the settings list, which is built, and the two settings rows still to come.
 */
export type ComingDoor = Exclude<ShellDoor, 'more'>;
export type ComingRow = Extract<SettingsRow, 'agent' | 'collections'>;
export type ComingPage = ComingDoor | ComingRow;

const ON_ITS_WAY = {
  badge: /*i18n*/ { id: 'On its way' },
  meanwhile: /*i18n*/ { id: 'Until it arrives, the rest of HelioGrid works as it does today.' },
  goToHome: /*i18n*/ { id: 'Back to Home' },
} as const;

/** Each page's promise in one line, then three things it will do. */
const STORY = {
  leads: {
    line: /*i18n*/ { id: 'Every enquiry kept alive, from the first call to a signed deal.' },
    points: [
      /*i18n*/ { id: 'Add a lead in seconds, from a call or a site visit' },
      /*i18n*/ { id: 'See who to call today, and who has waited too long' },
      /*i18n*/ { id: 'Move each lead through its stages to a decision' },
    ],
  },
  proposals: {
    line: /*i18n*/ { id: 'Priced proposals your customer opens on their phone.' },
    points: [
      /*i18n*/ { id: 'Built from your catalog, prices and payment terms' },
      /*i18n*/ { id: 'One link the customer opens, reads and accepts' },
      /*i18n*/ { id: 'See when it was opened, so you call at the right time' },
    ],
  },
  projects: {
    line: /*i18n*/ { id: 'Status, documents and money for every installation.' },
    points: [
      /*i18n*/ { id: 'Each installation’s stage at a glance' },
      /*i18n*/ { id: 'The documents each stage needs, in one place' },
      /*i18n*/ { id: 'What is billed, paid and still due' },
    ],
  },
  people: {
    line: /*i18n*/ { id: 'One accurate record for everyone who works with you.' },
    points: [
      /*i18n*/ { id: 'Each person’s role, contact and documents' },
      /*i18n*/ { id: 'Attendance and leave in one place' },
      /*i18n*/ { id: 'Who does what, by role' },
    ],
  },
  campaigns: {
    line: /*i18n*/ { id: 'Campaigns that bring new rooftops to your door.' },
    points: [
      /*i18n*/ { id: 'Reach people on the channels they already use' },
      /*i18n*/ { id: 'Every reply lands in your lead list' },
      /*i18n*/ { id: 'See which campaign brought each lead' },
    ],
  },
  add_lead: {
    line: /*i18n*/ { id: 'Capture a new enquiry before the call ends.' },
    points: [
      /*i18n*/ { id: 'A name and a number are enough to start' },
      /*i18n*/ { id: 'Where it came from, so you know what works' },
      /*i18n*/ { id: 'Straight into today’s list to call back' },
    ],
  },
  start_survey: {
    line: /*i18n*/ { id: 'Site surveys from the roof, on your phone.' },
    points: [
      /*i18n*/ { id: 'Measure the roof and mark shade and obstacles' },
      /*i18n*/ { id: 'Photos and readings kept, even on a weak signal' },
      /*i18n*/ { id: 'The survey goes straight into the design' },
    ],
  },
  search: {
    line: /*i18n*/ { id: 'Find any lead, customer or project from one box.' },
    points: [
      /*i18n*/ { id: 'Search by name, phone number or city' },
      /*i18n*/ { id: 'Jump straight to what you found' },
      /*i18n*/ { id: 'Your recent searches, one tap away' },
    ],
  },
  agent: {
    line: /*i18n*/ { id: 'A voice that answers and follows up when your team cannot.' },
    points: [
      /*i18n*/ { id: 'Calls answered in your customer’s language' },
      /*i18n*/ { id: 'Follow-up calls at the time you choose' },
      /*i18n*/ { id: 'Every call written into the lead’s history' },
    ],
  },
  collections: {
    line: /*i18n*/ { id: 'Your customers’ payments, stage by stage.' },
    points: [
      /*i18n*/ { id: 'A payment link your customer pays from their phone' },
      /*i18n*/ { id: 'A reminder before each stage falls due' },
      /*i18n*/ { id: 'Every payment matched to its proposal' },
    ],
  },
} as const satisfies Record<ComingPage, { line: unknown; points: readonly unknown[] }>;

export interface OnItsWayWords {
  readonly title: TranslatedText;
  readonly badge: TranslatedText;
  readonly line: TranslatedText;
  readonly points: readonly TranslatedText[];
  readonly meanwhile: TranslatedText;
  readonly goToHome: TranslatedText;
}

function titleOf(translate: Translator['t'], page: ComingPage): TranslatedText {
  return page === 'agent' || page === 'collections'
    ? settingsRowName(translate, page)
    : doorTitle(translate, page);
}

/** A coming page's words: its name, the badge, its promise, three points and the way home. */
export function onItsWayWords(translate: Translator['t'], page: ComingPage): OnItsWayWords {
  const story = STORY[page];
  return {
    title: titleOf(translate, page),
    badge: translate(ON_ITS_WAY.badge),
    line: translate(story.line),
    points: story.points.map((point) => translate(point)),
    meanwhile: translate(ON_ITS_WAY.meanwhile),
    goToHome: translate(ON_ITS_WAY.goToHome),
  };
}

/** Whether a settings row is one still to come, so its page says what it will do. */
export function isComingRow(row: SettingsRow): row is ComingRow {
  return row === 'agent' || row === 'collections';
}
