import type { TranslatedText } from '@heliogrid/contracts';
import type { CallOutcome, DisqualifyReason, LeadStage } from '@heliogrid/domain';

/*
 * Each form's words, built in `@heliogrid/i18n` (`leadActSheetWords`). Every form has its title,
 * a line saying what the act does, and the words of its send.
 */

interface FormWords {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly send: TranslatedText;
}

export interface LeadLogWords extends FormWords {
  /** The two things logged — "Call", "Note". */
  readonly call: TranslatedText;
  readonly note: TranslatedText;
  readonly kindLabel: TranslatedText;
  readonly outcomeLabel: TranslatedText;
  readonly outcome: Readonly<Record<CallOutcome, TranslatedText>>;
  /** What no answer does: one retry inside the calling window (`M02-43`). */
  readonly noAnswerLine: TranslatedText;
  readonly noteLabel: TranslatedText;
  readonly notePlaceholder: TranslatedText;
  /** The note's own send — "Add note". */
  readonly sendNote: TranslatedText;
}

export interface LeadVisitWords extends FormWords {
  readonly date: TranslatedText;
  readonly time: TranslatedText;
  readonly surveyor: TranslatedText;
  readonly surveyorPick: TranslatedText;
  readonly surveyorsLoading: TranslatedText;
  readonly surveyorsFailed: TranslatedText;
  readonly retry: TranslatedText;
  readonly noSurveyors: TranslatedText;
  readonly address: TranslatedText;
  readonly addressHint: TranslatedText;
  readonly close: TranslatedText;
}

export interface LeadSnoozeWords extends FormWords {
  readonly wakeOn: TranslatedText;
}

export interface LeadDisqualifyWords extends FormWords {
  readonly reasonLabel: TranslatedText;
  readonly reason: Readonly<Record<DisqualifyReason, TranslatedText>>;
  /** Under *Wrong number*: no one is offered a call to this number again (`M02-44`). */
  readonly wrongNumberLine: TranslatedText;
}

export type LeadJunkWords = FormWords;

export interface LeadCallBackWords extends FormWords {
  readonly date: TranslatedText;
  readonly time: TranslatedText;
}

export interface LeadMessageWords {
  readonly title: TranslatedText;
  /** Sent from the person's own phone; nothing is sent from here (`M02-33`). */
  readonly line: TranslatedText;
  readonly templateLabel: TranslatedText;
  readonly loading: TranslatedText;
  readonly failed: TranslatedText;
  readonly retry: TranslatedText;
  /** The act — "Copy" on the web, "Copy or share" on the phone — and its done word. */
  readonly send: TranslatedText;
  readonly handedOn: TranslatedText;
}

/** The lead's own details (`M02-03`): its name and city, filled on first contact. */
export interface LeadDetailsWords extends FormWords {
  readonly name: TranslatedText;
  readonly city: TranslatedText;
}

export interface LeadContactWords extends FormWords {
  readonly editTitle: TranslatedText;
  readonly name: TranslatedText;
  readonly phone: TranslatedText;
  readonly role: TranslatedText;
  readonly rolePick: TranslatedText;
  readonly noRole: TranslatedText;
  readonly labelsFailed: TranslatedText;
  readonly retry: TranslatedText;
  readonly newRole: TranslatedText;
  readonly addRole: TranslatedText;
  readonly close: TranslatedText;
  /** The refusal (`M02-02`): the number is another customer's, nothing was saved, and Merge. */
  readonly takenTitle: TranslatedText;
  readonly takenLine: TranslatedText;
  readonly outside: TranslatedText;
  readonly noName: TranslatedText;
  readonly ownerLabel: TranslatedText;
  readonly noOwner: TranslatedText;
  readonly stageLabel: TranslatedText;
  readonly stage: (stage: LeadStage) => TranslatedText;
  readonly lastContactLabel: TranslatedText;
  readonly merge: TranslatedText;
}
