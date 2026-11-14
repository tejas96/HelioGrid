import type { TranslatedText } from '@heliogrid/contracts';
import { type ComponentLine, PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { InputProps } from '../Input/Input.types';
import type { NumberFieldProps } from '../NumberField/NumberField.types';
import type { SelectProps } from '../Select/Select.types';
import type { TextareaProps } from '../Textarea/Textarea.types';
import {
  factOf,
  isFieldShown,
  type PartField,
  partFieldsOf,
  withFact,
} from './ProposalPartSheets.logic';
import type {
  PartEditWords,
  PaymentPartDraft,
  PaymentPartSheetWords,
  PhaseSheetWords,
  ProposalPaymentPartSheetProps,
  SheetPhase,
} from './ProposalPartSheets.types';

/** One of a part's print facts as the field that types it (`M06-29`). */
export type PartFactField =
  | { readonly kind: 'number'; readonly key: string; readonly props: NumberFieldProps }
  | { readonly kind: 'choice'; readonly key: string; readonly props: SelectProps }
  | { readonly kind: 'text'; readonly key: string; readonly props: InputProps };

/** A field under its own label, with a count beside the label. */
export interface CountedField<Props> {
  readonly label: TranslatedText;
  readonly tag: TranslatedText;
  readonly props: Props;
}

function factField(
  field: PartField,
  line: ComponentLine,
  words: PartEditWords,
  onLine: (line: ComponentLine) => void,
): PartFactField | null {
  const label = words.fields[field.key];
  const fact = factOf(line, field.key);
  const set = (value: string | number | null) => onLine(withFact(line, field.key, value));
  if (label === undefined) return null;
  if (field.input.kind === 'number') {
    return {
      kind: 'number',
      key: field.key,
      props: {
        steppers: false,
        words: words.number,
        commits: 'as-typed',
        label,
        value: typeof fact === 'number' ? fact : undefined,
        min: 0,
        precision: field.input.precision,
        ...(field.input.unit === undefined ? {} : { unit: field.input.unit }),
        onCommit: set,
        onClear: () => set(null),
      },
    };
  }
  if (field.input.kind === 'choice') {
    const names = words.options[field.key] ?? {};
    return {
      kind: 'choice',
      key: field.key,
      props: {
        label,
        placeholder: words.choose,
        closeLabel: words.closeLabel,
        value: fact === null ? '' : String(fact),
        onChange: set,
        options: field.input.values.map((value) => ({ value, label: names[value] ?? value })),
      },
    };
  }
  return {
    kind: 'text',
    key: field.key,
    props: { label, value: typeof fact === 'string' ? fact : '', onChange: set },
  };
}

/** The facts this kind of part prints, in the order the sheet draws them, each as its field. */
export function partFactFields(
  line: ComponentLine,
  words: PartEditWords,
  onLine: (line: ComponentLine) => void,
): PartFactField[] {
  return partFieldsOf(line.category)
    .filter((field) => isFieldShown(line, field.key))
    .map((field) => factField(field, line, words, onLine))
    .filter((field) => field !== null);
}

/**
 * The edit sheet's facts in rows: a kind's two leading figures (a panel's count and its watt peak)
 * share one row, as the design draws them; every other fact takes its own.
 */
export function partFactRows(facts: readonly PartFactField[]): PartFactField[][] {
  const [first, second, ...rest] = facts;
  if (first?.kind === 'number' && second?.kind === 'number') {
    return [[first, second], ...rest.map((field) => [field])];
  }
  return facts.map((field) => [field]);
}

/** The one line for the customer, with its count against the limit. */
export function partDescriptionField(
  line: ComponentLine,
  words: PartEditWords,
  onLine: (line: ComponentLine) => void,
): CountedField<TextareaProps> {
  const max = PROPOSAL_LIMITS.componentDescription;
  const description = line.description ?? '';
  return {
    label: words.description,
    tag: words.descriptionCount(description.length, max),
    /* The count is the label's tag, as the design draws it; the box draws none of its own, and a
       paste past the limit keeps its first `max` characters. */
    props: {
      label: words.description,
      labelSpokenOnly: true,
      value: description,
      rows: 3,
      onChange: (typed) => {
        const text = typed.slice(0, max);
        onLine({ ...line, description: text === '' ? null : text });
      },
    },
  };
}

/** One timeline step's three fields (`M06-12`, `T-M06-008`), and the phase *Done* hands back. */
export function phaseFields(
  phase: SheetPhase,
  words: PhaseSheetWords,
  onPhase: (phase: SheetPhase) => void,
  needsSentence = false,
) {
  const { phaseName, phaseDescription } = PROPOSAL_LIMITS;
  const name: CountedField<InputProps> = {
    label: words.name,
    tag: words.count(phase.name.length, phaseName),
    props: {
      label: words.name,
      labelSpokenOnly: true,
      value: phase.name,
      maxLength: phaseName,
      onChange: (text) => onPhase({ ...phase, name: text }),
    },
  };
  const description: CountedField<TextareaProps> = {
    label: words.description,
    tag: words.count(phase.description.length, phaseDescription),
    /* The count is the label's tag, as the design draws it; the box draws none of its own, and a
       paste past the limit keeps its first characters. */
    props: {
      label: words.description,
      labelSpokenOnly: true,
      value: phase.description,
      rows: 3,
      onChange: (text) => onPhase({ ...phase, description: text.slice(0, phaseDescription) }),
    },
  };
  /* A step with no length of its own — a template's — asks for none. */
  const duration: NumberFieldProps | null =
    phase.durationDays === undefined
      ? null
      : {
          steppers: false,
          words: words.number,
          commits: 'as-typed',
          label: words.duration,
          unit: words.days,
          value: phase.durationDays ?? undefined,
          min: 0,
          precision: 0,
          onCommit: (durationDays) => onPhase({ ...phase, durationDays }),
          onClear: () => onPhase({ ...phase, durationDays: null }),
        };
  return {
    name,
    description,
    duration,
    /** A step with no name cannot be kept, nor one that must say what happens and does not. */
    named: phase.name.trim() !== '' && (!needsSentence || phase.description.trim() !== ''),
    finished: { ...phase, name: phase.name.trim(), description: phase.description.trim() },
  };
}

/** The payment part sheet's two fields, and whether the part may be kept: it needs a name. */
export function paymentPartFields(
  part: PaymentPartDraft,
  words: PaymentPartSheetWords,
  stages: ProposalPaymentPartSheetProps['stages'],
  onPart: (part: PaymentPartDraft) => void,
) {
  const max = PROPOSAL_LIMITS.phaseName;
  const name: CountedField<InputProps> = {
    label: words.name,
    tag: words.count(part.label.length, max),
    props: {
      label: words.name,
      labelSpokenOnly: true,
      value: part.label,
      maxLength: max,
      onChange: (label) => onPart({ ...part, label }),
    },
  };
  const due: SelectProps = {
    label: words.due,
    placeholder: words.choose,
    closeLabel: words.closeLabel,
    value: part.dueOnStage,
    options: stages.map((stage) => ({ value: stage.value, label: stage.label })),
    onChange: (dueOnStage) => onPart({ ...part, dueOnStage }),
  };
  const label = part.label.trim();
  return { name, due, named: label !== '', finished: { ...part, label } };
}
