/**
 * The words the CRM's small marks say (`packages/ui`'s `StageTrackWords`, `LeadAgeWords`, and the
 * labels `LeadSourceMark` and `LeadStateBadge` take): a stage's place in the funnel, a source's
 * word, a state's word and how long a lead has waited — or since it was last contacted.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import {
  isUnassignedOverdue,
  LEAD_SOURCES,
  LEAD_STAGES,
  type LeadLifecycleState,
  type LeadSource,
  type LeadStage,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { LEAD_SOURCE_WORD, LEAD_STAGE_WORD, LEAD_STATE_WORD } from './crm-vocabulary';

const MARKS = {
  stepOf: /*i18n*/ { id: 'Step {step} of {total}: {stage}' },
  snoozedTill: /*i18n*/ { id: 'Snoozed till {date}' },
  ageMinutes: /*i18n*/ { id: '{count, plural, one {# min} other {# min}}' },
  ageHours: /*i18n*/ { id: '{count, plural, one {# h} other {# h}}' },
  ageDays: /*i18n*/ { id: '{count, plural, one {# d} other {# d}}' },
  waitingMinutes: /*i18n*/ {
    id: '{count, plural, one {Waiting # minute} other {Waiting # minutes}}',
  },
  waitingHours: /*i18n*/ { id: '{count, plural, one {Waiting # hour} other {Waiting # hours}}' },
  waitingDays: /*i18n*/ {
    id: '{count, plural, one {Waiting # day, past 24 hours} other {Waiting # days, past 24 hours}}',
  },
  contactedMinutes: /*i18n*/ { id: '{count, plural, one {# min ago} other {# min ago}}' },
  contactedHours: /*i18n*/ { id: '{count, plural, one {# h ago} other {# h ago}}' },
  contactedDays: /*i18n*/ { id: '{count, plural, one {# day ago} other {# days ago}}' },
  notContacted: /*i18n*/ { id: 'Not contacted yet' },
} as const;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** A span cut to its largest whole unit: minutes under an hour (one at least), hours under a day. */
function spanOf(elapsedMs: number): { unit: 'minutes' | 'hours' | 'days'; count: number } {
  if (elapsedMs < HOUR_MS)
    return { unit: 'minutes', count: Math.max(1, Math.floor(elapsedMs / MINUTE_MS)) };
  if (elapsedMs < DAY_MS) return { unit: 'hours', count: Math.floor(elapsedMs / HOUR_MS) };
  return { unit: 'days', count: Math.floor(elapsedMs / DAY_MS) };
}

/** `StageTrack`'s spoken name: "Step 3 of 8: Qualified" (`M02-41`). */
export function stageTrackWords(t: Translator['t']) {
  return {
    stepOf: (stage: LeadStage) =>
      t(MARKS.stepOf, {
        step: LEAD_STAGES.indexOf(stage) + 1,
        total: LEAD_STAGES.length,
        stage: t(LEAD_STAGE_WORD[stage]),
      }),
  };
}

/** A source's word; one a newer server has learned is shown as sent (`F3-05`). */
export function leadSourceWord(t: Translator['t'], source: string): TranslatedText {
  const known = LEAD_SOURCES.find((member): member is LeadSource => member === source);
  return known === undefined ? shownAsSent(source.replace(/_/g, ' ')) : t(LEAD_SOURCE_WORD[known]);
}

/**
 * A state's word for `LeadStateBadge` — or, for a snoozed lead whose wake day the screen shows,
 * "Snoozed till 14 Nov" with the day as the caller formats it.
 */
export function leadStateLabel(
  t: Translator['t'],
  state: LeadLifecycleState,
  wakeDay: string | null = null,
): TranslatedText {
  if (state === 'snoozed' && wakeDay !== null) return t(MARKS.snoozedTill, { date: wakeDay });
  return t(LEAD_STATE_WORD[state]);
}

/**
 * A waiting lead's age, cut as `LeadAge` draws it: whole days once it is past the 24-hour
 * escalation (`M02-50`), and hours until then — never "1 d" on a lead not yet past it.
 */
function waitOf(elapsedMs: number): { unit: 'minutes' | 'hours' | 'days'; count: number } {
  if (isUnassignedOverdue(0, elapsedMs))
    return { unit: 'days', count: Math.floor(elapsedMs / DAY_MS) };
  if (elapsedMs < HOUR_MS) return spanOf(elapsedMs);
  return { unit: 'hours', count: Math.floor(elapsedMs / HOUR_MS) };
}

/** `LeadAge`'s words: the short age and the sentence a screen reader says (`M02-24`, `M02-50`). */
export function leadAgeWords(t: Translator['t']) {
  const short = { minutes: MARKS.ageMinutes, hours: MARKS.ageHours, days: MARKS.ageDays };
  const spoken = {
    minutes: MARKS.waitingMinutes,
    hours: MARKS.waitingHours,
    days: MARKS.waitingDays,
  };
  return {
    age: (elapsedMs: number) => {
      const { unit, count } = waitOf(elapsedMs);
      return t(short[unit], { count });
    },
    spoken: (elapsedMs: number) => {
      const { unit, count } = waitOf(elapsedMs);
      return t(spoken[unit], { count });
    },
  };
}

/** When a lead was last contacted, from the milliseconds since — "4 days ago" (`M02-08`). */
export function lastContactWord(t: Translator['t'], elapsedMs: number | null): TranslatedText {
  if (elapsedMs === null) return t(MARKS.notContacted);
  const { unit, count } = spanOf(elapsedMs);
  const message = {
    minutes: MARKS.contactedMinutes,
    hours: MARKS.contactedHours,
    days: MARKS.contactedDays,
  };
  return t(message[unit], { count });
}
