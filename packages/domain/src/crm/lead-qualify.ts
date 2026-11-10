import {
  BUYING_TIMELINES,
  type BuyingTimeline,
  DECISION_MAKERS,
  type DecisionMaker,
  ROOF_OWNERSHIPS,
  ROOF_TYPES,
  type RoofOwnership,
  type RoofType,
  SHADINGS,
  type Shading,
} from './vocabulary';

/**
 * Qualification on the lead (`M02-39`): the six things a call can know, answered inline with no
 * form and no submit. Each answer saves alone, so one that fails to save never takes the others
 * with it, and the card says where it stands per question.
 */

/** The six questions in the order the card asks them: the bill, then the five chip questions. */
export const QUALIFY_QUESTIONS = [
  'monthlyBill',
  'roofOwnership',
  'roofType',
  'shading',
  'timeline',
  'decisionMaker',
] as const;
export type QualifyQuestion = (typeof QUALIFY_QUESTIONS)[number];

/** The five answered by a chip; the bill is typed. */
export type QualifyChoiceQuestion = Exclude<QualifyQuestion, 'monthlyBill'>;

/** Each chip question's answers, in the order its chips stand — the vocabulary's own tuples. */
export const QUALIFY_CHOICES = {
  roofOwnership: ROOF_OWNERSHIPS,
  roofType: ROOF_TYPES,
  shading: SHADINGS,
  timeline: BUYING_TIMELINES,
  decisionMaker: DECISION_MAKERS,
} as const satisfies Record<QualifyChoiceQuestion, readonly string[]>;

/** What each answer is: the bill as the wire writes an amount, each chip its vocabulary key. */
export interface QualifyValues {
  readonly monthlyBill: string;
  readonly roofOwnership: RoofOwnership;
  readonly roofType: RoofType;
  readonly shading: Shading;
  readonly timeline: BuyingTimeline;
  readonly decisionMaker: DecisionMaker;
}

/** The answers on the record; `null` is a question not asked yet — its named gap. */
export type QualifyAnswers = { readonly [Q in QualifyQuestion]: QualifyValues[Q] | null };

/** One answer as it is sent: its question alone, `null` emptying it back to its gap. */
export type QualifyEdit = { readonly [Q in QualifyQuestion]?: QualifyValues[Q] | null };

function isOneOf<T extends string>(members: readonly T[], value: string): value is T {
  return members.some((member) => member === value);
}

/** Each chip question's edit, refused when the value is not one of its answers. */
const CHOICE_EDIT: {
  readonly [Q in QualifyChoiceQuestion]: (value: string | null) => QualifyEdit | null;
} = {
  roofOwnership: (value) =>
    value === null || isOneOf(ROOF_OWNERSHIPS, value) ? { roofOwnership: value } : null,
  roofType: (value) => (value === null || isOneOf(ROOF_TYPES, value) ? { roofType: value } : null),
  shading: (value) => (value === null || isOneOf(SHADINGS, value) ? { shading: value } : null),
  timeline: (value) =>
    value === null || isOneOf(BUYING_TIMELINES, value) ? { timeline: value } : null,
  decisionMaker: (value) =>
    value === null || isOneOf(DECISION_MAKERS, value) ? { decisionMaker: value } : null,
};

/**
 * The edit that sends `value` as the answer to `question` — or `null` when the value is not one of
 * the question's answers, so no edit leaves with a word the server would refuse.
 */
export function qualifyEditOf(question: QualifyQuestion, value: string | null): QualifyEdit | null {
  return question === 'monthlyBill' ? { monthlyBill: value } : CHOICE_EDIT[question](value);
}

/** One answer while it is saved: on its way, or come back unsaved. */
export interface QualifySave {
  readonly value: string | null;
  readonly status: 'saving' | 'failed';
}

/** The saves the card is tracking, by question; a question absent here stands as recorded. */
export type QualifySaves = { readonly [Q in QualifyQuestion]?: QualifySave };

/** One question as the card draws it. */
export interface QualifyQuestionView {
  readonly question: QualifyQuestion;
  /** The answers to choose from, in order; none for the bill, which is typed. */
  readonly choices: readonly string[];
  /** The answer on the record; `null` draws "Not asked yet". */
  readonly saved: string | null;
  /** What the question draws as chosen: the answer on its way while it saves, else the record's. */
  readonly shown: string | null;
  /** The answer on its way or come back unsaved — `Not saved · Try again` sits at this question. */
  readonly save: QualifySave | null;
  /** This answer was the last to land: the *Saved* mark shows beside it. */
  readonly savedMark: boolean;
}

export interface QualifyCardView {
  readonly questions: readonly QualifyQuestionView[];
  /** How many of the six are answered on the record. */
  readonly answered: number;
}

/**
 * The qualify card: each question with its recorded answer, the save it is waiting on or that came
 * back unsaved, and which answer landed last. A failed save marks its own question only.
 */
export function qualifyCardOf(
  answers: QualifyAnswers,
  saves: QualifySaves,
  lastSaved: QualifyQuestion | null,
): QualifyCardView {
  const questions = QUALIFY_QUESTIONS.map((question): QualifyQuestionView => {
    const saved = answers[question];
    const save = saves[question] ?? null;
    return {
      question,
      choices: question === 'monthlyBill' ? [] : QUALIFY_CHOICES[question],
      saved,
      shown: save?.status === 'saving' ? save.value : saved,
      save,
      savedMark: save === null && lastSaved === question,
    };
  });
  return {
    questions,
    answered: QUALIFY_QUESTIONS.filter((question) => answers[question] !== null).length,
  };
}
