import type { TranslatedText } from '@heliogrid/contracts';
import type {
  QualifyChoiceQuestion,
  QualifyQuestion,
  QualifyQuestionView,
} from '@heliogrid/domain';
import type { NumberFieldWords } from '../NumberField/NumberField.types';

/** Every word the card says, built in `@heliogrid/i18n` (`qualifyCardWords`). */
export interface QualifyCardWords {
  /** The card's overline — "Qualify". */
  readonly title: TranslatedText;
  /** "4 of 6". */
  readonly count: (answered: number, total: number) => TranslatedText;
  readonly question: Readonly<Record<QualifyQuestion, TranslatedText>>;
  /** One chip's words — "RCC flat". */
  readonly choice: (question: QualifyChoiceQuestion, value: string) => TranslatedText;
  /** A question not asked yet — its named gap. */
  readonly notAsked: TranslatedText;
  /** The mark beside the answer that landed last. */
  readonly saved: TranslatedText;
  /** Beside an answer while it is on its way. */
  readonly saving: TranslatedText;
  /** At a question whose answer came back unsaved: what happened, and that the others are kept. */
  readonly notSaved: TranslatedText;
  readonly retry: TranslatedText;
  readonly billField: NumberFieldWords;
  /** Mark qualified (`M02-45`), and the line saying the person decides, not the answers. */
  readonly markQualified: TranslatedText;
  readonly markQualifiedLine: TranslatedText;
}

/** Mark qualified, offered from `new` or `contacted`: whether it is out, and how it came back. */
export interface QualifyMarkAct {
  readonly onPress: () => void;
  readonly pending: boolean;
  /** Why it came back undone, said under the button; null otherwise. */
  readonly failure: TranslatedText | null;
}

/**
 * The six qualifying questions inline on the lead (`M02-39`): the monthly bill typed in the
 * tenant's currency with its `assumed` tier, and the five chip questions — no form and no submit.
 * Each answer saves alone the moment it is given; the chip shows as chosen while it saves, the
 * *Saved* mark follows it, and one that fails says *Not saved · Try again* at its own question
 * while the others stay saved.
 */
export interface QualifyCardProps {
  readonly questions: readonly QualifyQuestionView[];
  /** How many of the six are answered on the record. */
  readonly answered: number;
  /** A chip tapped, or the bill committed — `null` empties the bill back to its gap. */
  readonly onAnswer: (question: QualifyQuestion, value: string | null) => void;
  /** Sends the unsaved answer at that question again. */
  readonly onRetry: (question: QualifyQuestion) => void;
  /** Null when the lead's stage or state offers no Mark qualified. */
  readonly markQualified: QualifyMarkAct | null;
  readonly words: QualifyCardWords;
}
