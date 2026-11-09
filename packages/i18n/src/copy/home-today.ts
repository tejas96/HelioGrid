import type { TranslatedText } from '@heliogrid/contracts';
import type { DayPart, SetupReadiness, SetupStep } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { settingsRowName, settingsWords } from './settings';

/** Home's greeting, its first-proposal hero and its glance (redesign direction A). */
export const HOME_TODAY = {
  readyOverline: /*i18n*/ { id: 'Your first proposal' },
  readyTitle: /*i18n*/ {
    id: '{left, plural, one {# step to your first proposal} other {# steps to your first proposal}}',
  },
  readyDoneTitle: /*i18n*/ { id: 'Ready to send proposals' },
  readyLine: /*i18n*/ {
    id: 'Each step fills in what your proposals print: who you are, your look, your prices and how you get paid.',
  },
  readyDoneLine: /*i18n*/ { id: 'Everything a proposal needs is set. Add a lead to begin.' },
  stepsDone: /*i18n*/ { id: '{done} of {total} done' },
  next: /*i18n*/ { id: 'Next' },
  continue: /*i18n*/ { id: 'Continue' },
  stepsName: /*i18n*/ { id: 'Setup steps' },
  done: /*i18n*/ { id: 'Done' },
  loading: /*i18n*/ { id: 'Loading' },
  glanceName: /*i18n*/ { id: 'Today at a glance' },
  trial: /*i18n*/ { id: 'Trial' },
  daysLeft: /*i18n*/ { id: '{days, plural, one {day left} other {days left}}' },
  items: /*i18n*/ { id: '{count, plural, one {item} other {items}}' },
  people: /*i18n*/ { id: '{count, plural, one {person} other {people}}' },
  voice: /*i18n*/ { id: 'Voice minutes' },
  ofCap: /*i18n*/ { id: 'of {cap}' },
  used: /*i18n*/ { id: 'used' },
  goTo: /*i18n*/ { id: '{label}: {value} {unit}. Open {label}' },
} as const;

const GREETING: Record<DayPart, { id: string }> = {
  morning: /*i18n*/ { id: 'Good morning, {name}' },
  afternoon: /*i18n*/ { id: 'Good afternoon, {name}' },
  evening: /*i18n*/ { id: 'Good evening, {name}' },
  late: /*i18n*/ { id: 'Hello, {name}' },
};

/** "Good morning, Arjun" — the part of the day the hour names, and the person's first name. */
export function homeGreeting(
  translate: Translator['t'],
  part: DayPart,
  name: string,
): TranslatedText {
  return translate(GREETING[part], { name: name.trim().split(/\s+/)[0] ?? name });
}

/** Every word the first-proposal hero draws around its figure and its steps. */
export interface ReadinessWords {
  readonly overline: TranslatedText;
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly count: TranslatedText;
  readonly next: TranslatedText;
  readonly continueLabel: TranslatedText;
  readonly stepsName: TranslatedText;
  readonly done: TranslatedText;
  readonly loading: TranslatedText;
}

export function readinessWords(
  translate: Translator['t'],
  readiness: Pick<SetupReadiness, 'done' | 'total' | 'complete'>,
): ReadinessWords {
  const { done, total, complete } = readiness;
  return {
    overline: translate(HOME_TODAY.readyOverline),
    title: complete
      ? translate(HOME_TODAY.readyDoneTitle)
      : translate(HOME_TODAY.readyTitle, { left: total - done }),
    line: translate(complete ? HOME_TODAY.readyDoneLine : HOME_TODAY.readyLine),
    count: translate(HOME_TODAY.stepsDone, { done, total }),
    next: translate(HOME_TODAY.next),
    continueLabel: translate(HOME_TODAY.continue),
    stepsName: translate(HOME_TODAY.stepsName),
    done: translate(HOME_TODAY.done),
    loading: translate(HOME_TODAY.loading),
  };
}

/** A step's name and what it fills in — the settings list's own words for its row. */
export function readinessStepWords(
  translate: Translator['t'],
  step: SetupStep,
): { readonly label: TranslatedText; readonly detail: TranslatedText } {
  return { label: settingsRowName(translate, step), detail: settingsWords(translate).hints[step] };
}

/** The glance's words: each fact's label, the unit after its figure, and the strip's name. */
export function homeGlanceWords(translate: Translator['t']) {
  return {
    name: translate(HOME_TODAY.glanceName),
    trial: translate(HOME_TODAY.trial),
    daysLeft: (days: number) => translate(HOME_TODAY.daysLeft, { days }),
    catalog: settingsRowName(translate, 'catalog'),
    items: (count: number) => translate(HOME_TODAY.items, { count }),
    team: settingsRowName(translate, 'team'),
    people: (count: number) => translate(HOME_TODAY.people, { count }),
    voice: translate(HOME_TODAY.voice),
    ofCap: (cap: string) => translate(HOME_TODAY.ofCap, { cap }),
    used: translate(HOME_TODAY.used),
    goTo: (label: TranslatedText, value: string, unit: TranslatedText) =>
      translate(HOME_TODAY.goTo, { label, value, unit }),
  };
}
