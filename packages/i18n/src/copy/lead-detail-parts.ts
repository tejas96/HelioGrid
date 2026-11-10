/**
 * Lead Detail's cards (`SCR-M02-04`): the qualify card (`packages/ui`'s `QualifyCardWords`,
 * `M02-39`), contacts and calling facts (`LeadContactsCardWords`, `M02-34`, `M02-37`) and the six
 * sections (`LeadSectionsWords`, `M02-32`).
 */
import type { LeadDetail, TranslatedText } from '@heliogrid/contracts';
import {
  type ContactRoleSeed,
  LANGUAGES,
  type LeadActFailure,
  type LeadDetailSection,
  type LeadDetailView,
  type QualifyChoiceQuestion,
  TASK_KINDS,
  type TaskKind,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import {
  BUYING_TIMELINE_WORD,
  CONTACT_ROLE_SEED_WORD,
  DECISION_MAKER_WORD,
  QUALIFY_QUESTION_LABEL,
  ROOF_OWNERSHIP_WORD,
  ROOF_TYPE_WORD,
  SHADING_WORD,
  TASK_KIND_WORD,
} from './crm-vocabulary';
import { leadActFailureWords } from './lead-act-failure';
import { LEAD_DETAIL, leadDockWords, leadHeroWords } from './lead-detail';
import { numberFieldWords } from './number-field';
import { SHELL } from './shell';

type T = Translator['t'];

/** A contact's role as the lead holds it: a seeded one, a company's own as typed, or none. */
type ContactRole = { readonly seed: ContactRoleSeed | null; readonly text: string | null } | null;

/** A task as its title is said: its kind, or a custom task's own words. */
interface TaskTitleFacts {
  readonly kind: string;
  readonly title: string | null;
}

/* The two below are type aliases, not interfaces: `t` takes its values as a record, and only an
   alias carries the implicit index signature a record needs. */

/** A day and a time as the caller formats them on the tenant's clock. */
type DayAndTime = { readonly day: string; readonly time: string };

/** The booked visit as its line names it. */
type VisitLineFacts = DayAndTime & { readonly surveyor: string };

const PARTS = {
  qualify: /*i18n*/ { id: 'Qualify' },
  answeredOf: /*i18n*/ { id: '{answered} of {total}' },
  notAsked: /*i18n*/ { id: 'Not asked yet' },
  saved: /*i18n*/ { id: 'Saved' },
  saving: /*i18n*/ { id: 'Saving…' },
  notSaved: /*i18n*/ { id: 'Not saved. Your other answers are kept.' },
  markQualified: /*i18n*/ { id: 'Mark qualified' },
  markQualifiedLine: /*i18n*/ { id: 'The answers inform. You decide.' },
  contacts: /*i18n*/ { id: 'Contacts · {count}' },
  addContact: /*i18n*/ { id: 'Add a contact' },
  primary: /*i18n*/ { id: 'Primary' },
  callWho: /*i18n*/ { id: 'Call {who}' },
  editWho: /*i18n*/ { id: 'Edit {who}' },
  makePrimary: /*i18n*/ { id: 'Make {who} the primary contact' },
  makingPrimary: /*i18n*/ { id: 'Making primary…' },
  doNotCall: /*i18n*/ { id: 'Do not call' },
  doNotCallHint: /*i18n*/ { id: 'No one is offered a call to this customer.' },
  language: /*i18n*/ { id: 'Language' },
  languageUnset: /*i18n*/ { id: 'Not set' },
  tabsLabel: /*i18n*/ { id: 'Lead sections' },
  site: /*i18n*/ { id: 'Site' },
  siteGap: /*i18n*/ { id: 'Confirmed when a visit is booked' },
  confirmed: /*i18n*/ { id: 'Confirmed' },
  reschedule: /*i18n*/ { id: 'Reschedule a no-show' },
  confirmation: /*i18n*/ { id: 'Copy the confirmation' },
  designs: /*i18n*/ { id: '{count, plural, one {# design} other {# designs}}' },
  noDesign: /*i18n*/ { id: 'No design yet' },
  designsLine: /*i18n*/ { id: 'Designs are made in the design studio, which arrives later.' },
  proposals: /*i18n*/ { id: '{count, plural, one {# proposal} other {# proposals}}' },
  noProposal: /*i18n*/ { id: 'No proposal yet' },
  proposalsLine: /*i18n*/ { id: 'A proposal is made from a design.' },
  files: /*i18n*/ { id: '{count, plural, one {# file on this lead} other {# files on this lead}}' },
  noFiles: /*i18n*/ { id: 'No files yet' },
  filesLine: /*i18n*/ { id: 'Files reach the lead from its survey and documents.' },
  noTasks: /*i18n*/ { id: 'No open tasks' },
  addCallBack: /*i18n*/ { id: 'Add a call-back' },
  overdue: /*i18n*/ { id: 'Overdue' },
  done: /*i18n*/ { id: 'Done' },
  markDone: /*i18n*/ { id: 'Mark “{task}” done' },
  reopenTask: /*i18n*/ { id: 'Reopen “{task}”' },
  due: /*i18n*/ { id: 'Due {day}, {time}' },
  visitLine: /*i18n*/ { id: '{day}, {time} · {surveyor}' },
} as const;

const SECTION: Record<LeadDetailSection, MessageRef> = {
  timeline: /*i18n*/ { id: 'Timeline' },
  site: PARTS.site,
  designs: /*i18n*/ { id: 'Designs' },
  proposals: /*i18n*/ { id: 'Proposals' },
  tasks: /*i18n*/ { id: 'Tasks' },
  files: /*i18n*/ { id: 'Files' },
};

const CHOICE_WORD: { readonly [Q in QualifyChoiceQuestion]: Readonly<Record<string, MessageRef>> } =
  {
    roofOwnership: ROOF_OWNERSHIP_WORD,
    roofType: ROOF_TYPE_WORD,
    shading: SHADING_WORD,
    timeline: BUYING_TIMELINE_WORD,
    decisionMaker: DECISION_MAKER_WORD,
  };

/** `QualifyCard`'s words. An answer a newer server has learned is shown as sent (`F3-05`). */
export function qualifyCardWords(t: T) {
  return {
    title: t(PARTS.qualify),
    count: (answered: number, total: number) => t(PARTS.answeredOf, { answered, total }),
    question: {
      monthlyBill: t(QUALIFY_QUESTION_LABEL.monthlyBill),
      roofOwnership: t(QUALIFY_QUESTION_LABEL.roofOwnership),
      roofType: t(QUALIFY_QUESTION_LABEL.roofType),
      shading: t(QUALIFY_QUESTION_LABEL.shading),
      timeline: t(QUALIFY_QUESTION_LABEL.timeline),
      decisionMaker: t(QUALIFY_QUESTION_LABEL.decisionMaker),
    },
    choice: (question: QualifyChoiceQuestion, value: string): TranslatedText => {
      const message = CHOICE_WORD[question][value];
      return message === undefined ? shownAsSent(value) : t(message);
    },
    notAsked: t(PARTS.notAsked),
    saved: t(PARTS.saved),
    saving: t(PARTS.saving),
    notSaved: t(PARTS.notSaved),
    retry: t(SHELL.tryAgain),
    billField: numberFieldWords(t),
    markQualified: t(PARTS.markQualified),
    markQualifiedLine: t(PARTS.markQualifiedLine),
  };
}

/** A contact's role label: a seeded one in the catalog's words, a company's own as typed (`F3-10`). */
export function contactRoleWord(t: T, role: ContactRole): TranslatedText | null {
  if (role === null) return null;
  if (role.seed !== null) return t(CONTACT_ROLE_SEED_WORD[role.seed]);
  return role.text === null ? null : shownAsSent(role.text);
}

/** `LeadContactsCard`'s words, and the language list by each language's own name. */
export function leadContactsWords(t: T) {
  return {
    title: (count: number) => t(PARTS.contacts, { count }),
    add: t(PARTS.addContact),
    primary: t(PARTS.primary),
    noName: t(LEAD_DETAIL.noName),
    call: (who: string) => t(PARTS.callWho, { who }),
    edit: (who: string) => t(PARTS.editWho, { who }),
    makePrimary: (who: string) => t(PARTS.makePrimary, { who }),
    makingPrimary: t(PARTS.makingPrimary),
    doNotCall: t(PARTS.doNotCall),
    doNotCallHint: t(PARTS.doNotCallHint),
    language: t(PARTS.language),
    languageUnset: t(PARTS.languageUnset),
    close: t(SHELL.close),
  };
}

/** The UI languages as the language field lists them, each by its own name. */
export function contactLanguageOptions(): { value: string; label: string }[] {
  return Object.entries(LANGUAGES).map(([code, facts]) => ({ value: code, label: facts.endonym }));
}

/** A task's words: its kind's, or a custom task's own as typed; a kind a newer server learned as sent. */
export function leadTaskTitle(t: T, task: TaskTitleFacts): TranslatedText {
  if (task.title !== null) return shownAsSent(task.title);
  const kind = TASK_KINDS.find((known): known is TaskKind => known === task.kind);
  return kind === undefined ? shownAsSent(task.kind.replace(/_/g, ' ')) : t(TASK_KIND_WORD[kind]);
}

/** `LeadSections`' words, with the day and time formatters the caller holds for the tenant. */
export function leadSectionsWords(t: T) {
  return {
    tabs: {
      timeline: t(SECTION.timeline),
      site: t(SECTION.site),
      designs: t(SECTION.designs),
      proposals: t(SECTION.proposals),
      tasks: t(SECTION.tasks),
      files: t(SECTION.files),
    },
    tabsLabel: t(PARTS.tabsLabel),
    site: t(PARTS.site),
    siteGap: t(PARTS.siteGap),
    confirmed: t(PARTS.confirmed),
    reschedule: t(PARTS.reschedule),
    confirmation: t(PARTS.confirmation),
    designs: (count: number) => t(PARTS.designs, { count }),
    noDesign: t(PARTS.noDesign),
    designsLine: t(PARTS.designsLine),
    proposals: (count: number) => t(PARTS.proposals, { count }),
    noProposal: t(PARTS.noProposal),
    proposalsLine: t(PARTS.proposalsLine),
    files: (count: number) => t(PARTS.files, { count }),
    noFiles: t(PARTS.noFiles),
    filesLine: t(PARTS.filesLine),
    noTasks: t(PARTS.noTasks),
    addCallBack: t(PARTS.addCallBack),
    overdue: t(PARTS.overdue),
    doneMark: t(PARTS.done),
    markDone: (task: TranslatedText) => t(PARTS.markDone, { task }),
    reopen: (task: TranslatedText) => t(PARTS.reopenTask, { task }),
  };
}

/** "Due Fri 14 Nov, 11:30" — the day and time as the caller formats them on the tenant's clock. */
export function leadTaskDue(t: T, when: DayAndTime) {
  return t(PARTS.due, when);
}

/** "Fri 14 Nov, 10:00 · Rajesh Jadhav" — the booked visit, as the Site section names it. */
export function leadVisitLine(t: T, visit: VisitLineFacts) {
  return t(PARTS.visitLine, visit);
}

/**
 * `LeadDetailCards`' words: the contacts card's and the sections', the languages by their own
 * names, and how a role, a task, its due time, the booked visit and an act that came back undone
 * are said.
 */
export function leadDetailCardsWords(t: T) {
  return {
    contacts: leadContactsWords(t),
    sections: leadSectionsWords(t),
    languages: contactLanguageOptions(),
    role: (role: ContactRole) => contactRoleWord(t, role),
    taskTitle: (task: TaskTitleFacts) => leadTaskTitle(t, task),
    taskDue: (when: DayAndTime) => leadTaskDue(t, when),
    visitLine: (visit: VisitLineFacts) => leadVisitLine(t, visit),
    failure: (failed: LeadActFailure) => leadActFailureWords(t, failed),
  };
}

/**
 * `LeadWorkCards`' words for this lead: the hero's, chosen by its stage, deal, referrer, parked
 * state, failed tries and owner; the dock's and the qualify card's; and how an act that came back
 * undone is said. `day` formats the wake day on the tenant's clock.
 */
export function leadWorkCardsWords(
  t: T,
  { lead, cameFrom }: Pick<LeadDetail, 'lead' | 'cameFrom'>,
  { marks }: Pick<LeadDetailView, 'marks'>,
  day: (date: string) => string,
) {
  return {
    hero: leadHeroWords(t, {
      stage: lead.stage,
      segment: lead.segment,
      source: lead.source,
      cameFrom: cameFrom?.name ?? null,
      state: lead.state,
      wakeDay: marks.wakeOn === null ? null : day(marks.wakeOn),
      triesWithoutAnswer: marks.triesWithoutAnswer,
      ownerName: lead.owner?.name ?? null,
    }),
    dock: leadDockWords(t),
    qualify: qualifyCardWords(t),
    failure: (failed: LeadActFailure) => leadActFailureWords(t, failed),
  };
}
