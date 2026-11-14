import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalStep, StepStanding } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * The words of the proposal builder's frame (`packages/ui`'s `ProposalBuilder`): the eleven steps'
 * names, the capsule, the dock, the save state and the list of every step. A step's short word is
 * what the rail and the capsule show; its title is the step in words.
 */

type T = Translator['t'];

const STEP_WORD: Record<ProposalStep, { id: string }> = {
  company: /*i18n*/ { id: 'Company' },
  achievements: /*i18n*/ { id: 'Achievements' },
  system: /*i18n*/ { id: 'System' },
  performance: /*i18n*/ { id: 'Generation' },
  financials: /*i18n*/ { id: 'Savings' },
  timeline: /*i18n*/ { id: 'Timeline' },
  payment: /*i18n*/ { id: 'Payment' },
  components: /*i18n*/ { id: 'Components' },
  terms: /*i18n*/ { id: 'Terms' },
  client: /*i18n*/ { id: 'Client' },
  bank: /*i18n*/ { id: 'Bank' },
};

const STEP_TITLE: Record<ProposalStep, { id: string }> = {
  company: /*i18n*/ { id: 'Your company' },
  achievements: /*i18n*/ { id: 'Your track record' },
  system: /*i18n*/ { id: 'System and price' },
  performance: /*i18n*/ { id: 'What it will generate' },
  financials: /*i18n*/ { id: 'What it will save' },
  timeline: /*i18n*/ { id: 'How the work goes' },
  payment: /*i18n*/ { id: 'How it is paid' },
  components: /*i18n*/ { id: 'What goes on the roof' },
  terms: /*i18n*/ { id: 'Terms and conditions' },
  client: /*i18n*/ { id: 'Who it is for' },
  bank: /*i18n*/ { id: 'Where to pay' },
};

const STANDING: Record<StepStanding, { id: string }> = {
  done: /*i18n*/ { id: 'Done' },
  default: /*i18n*/ { id: 'Default' },
  to_do: /*i18n*/ { id: 'To do' },
};

const FRAME = {
  close: /*i18n*/ { id: 'Close and keep the draft' },
  openSteps: /*i18n*/ { id: 'All steps: {at} of {total}, {title}' },
  count: /*i18n*/ { id: '{at} of {total}' },
  preview: /*i18n*/ { id: 'See what {name} sees' },
  steps: /*i18n*/ { id: 'Steps' },
  spokenStep: /*i18n*/ { id: '{title}, {standing}' },
  stepOf: /*i18n*/ { id: 'Step {at} of {total}' },
  back: /*i18n*/ { id: 'Back' },
  next: /*i18n*/ { id: 'Next · {title}' },
  last: /*i18n*/ { id: 'Generate proposal' },
  lastToFix: /*i18n*/ { id: 'Generate · {count} to fix' },
  generate: /*i18n*/ { id: 'Generate' },
  quick: /*i18n*/ { id: 'Quick' },
  saved: /*i18n*/ { id: 'Saved' },
  saving: /*i18n*/ { id: 'Saving' },
  unsaved: /*i18n*/ {
    id: '{count, plural, one {# field not saved} other {# fields not saved}}',
  },
  offline: /*i18n*/ { id: 'No connection — your typing stays here' },
  conflict: /*i18n*/ { id: 'Changed on another device — reload' },
  title: /*i18n*/ { id: 'Proposal for {name}' },
  draft: /*i18n*/ { id: 'Draft' },
  pays: /*i18n*/ { id: '{name} pays' },
  updating: /*i18n*/ { id: 'Updating…' },
  whatSees: /*i18n*/ { id: 'What {name} sees' },
  pageLine: /*i18n*/ { id: 'Page {page} of {count} · {title}' },
  pageLeftOut: /*i18n*/ { id: 'Left out of the PDF · {title}' },
  pageWaits: /*i18n*/ { id: '{name}’s pages appear once the price is typed in System.' },
} as const;

const LIST = {
  title: /*i18n*/ { id: 'All steps' },
  quickLabel: /*i18n*/ { id: 'Quick mode' },
  quickLine: /*i18n*/ { id: 'Only 4 steps. The rest use your company defaults.' },
  noteAny: /*i18n*/ { id: 'You can open the steps in any order.' },
  noteQuick: /*i18n*/ { id: 'Quick mode runs the same checks at Generate.' },
  close: /*i18n*/ { id: 'Close' },
} as const;

/** A step's short word and its title, in the reader's language. */
export function proposalStepNames(t: T) {
  const name = (step: ProposalStep) => ({
    title: t(STEP_WORD[step]),
    heading: t(STEP_TITLE[step]),
  });
  const names: Record<ProposalStep, { title: TranslatedText; heading: TranslatedText }> = {
    company: name('company'),
    achievements: name('achievements'),
    system: name('system'),
    performance: name('performance'),
    financials: name('financials'),
    timeline: name('timeline'),
    payment: name('payment'),
    components: name('components'),
    terms: name('terms'),
    client: name('client'),
    bank: name('bank'),
  };
  return names;
}

/** What the frame says for one proposal: `name` is the customer's first name. */
export function proposalBuilderWords(t: T, facts: { name: string; fullName: string }) {
  return {
    close: t(FRAME.close),
    openSteps: (at: number, total: number, title: TranslatedText) =>
      t(FRAME.openSteps, { at, total, title }),
    count: (at: number, total: number) => t(FRAME.count, { at, total }),
    preview: t(FRAME.preview, { name: facts.name }),
    steps: t(FRAME.steps),
    spokenStep: (title: TranslatedText, standing: StepStanding) =>
      t(FRAME.spokenStep, { title, standing: t(STANDING[standing]) }),
    stepOf: (at: number, total: number) => t(FRAME.stepOf, { at, total }),
    back: t(FRAME.back),
    next: (title: TranslatedText) => t(FRAME.next, { title }),
    last: t(FRAME.last),
    lastToFix: (count: number) => t(FRAME.lastToFix, { count }),
    generate: t(FRAME.generate),
    quick: t(FRAME.quick),
    saved: t(FRAME.saved),
    saving: t(FRAME.saving),
    unsaved: (count: number) => t(FRAME.unsaved, { count }),
    offline: t(FRAME.offline),
    conflict: t(FRAME.conflict),
    /** The frame's own lines the hook hands it beside these words. */
    title: t(FRAME.title, { name: facts.fullName }),
    status: t(FRAME.draft),
    pays: t(FRAME.pays, { name: facts.name }),
    /** The payable while the server works it out again: the old figure is never shown as current (`F8-12`). */
    updating: t(FRAME.updating),
    whatSees: t(FRAME.whatSees, { name: facts.name }),
    /** `Page 6 of 9 · Price and payment`; a page left out of the document says so instead. */
    pageLine: (page: number | null, count: number, title: TranslatedText) =>
      page === null ? t(FRAME.pageLeftOut, { title }) : t(FRAME.pageLine, { page, count, title }),
    /** The stage before a price is typed: a page states no figure it lacks, so none is drawn yet. */
    pageWaits: t(FRAME.pageWaits, { name: facts.name }),
  };
}

/** The list of every step: its title, the Quick switch, the standings and its act. */
export function proposalStepListWords(t: T, facts: { quick: boolean }) {
  return {
    closeLabel: t(LIST.close),
    title: t(LIST.title),
    quickLabel: t(LIST.quickLabel),
    quickLine: t(LIST.quickLine),
    standing: {
      done: t(STANDING.done),
      default: t(STANDING.default),
      to_do: t(STANDING.to_do),
    },
    generate: t(FRAME.last),
    note: t(facts.quick ? LIST.noteQuick : LIST.noteAny),
  };
}
