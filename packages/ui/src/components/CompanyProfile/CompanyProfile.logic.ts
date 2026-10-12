import {
  COMPANY_PROFILE_PARTS,
  type CompanyProfilePart,
  isTypicalSystemSize,
  type StandingMark,
  TYPICAL_SYSTEM_KWP,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { AccordionItem, AccordionItemState } from '../Accordion/Accordion.types';
import type { GlyphMark } from '../AppShell/ShellGlyph.logic';
import type { NumberFieldProps } from '../NumberField/NumberField.types';
import type {
  CompanyProfileField,
  CompanyProfileValues,
  CompanyProfileWords,
} from './CompanyProfile.types';

const STATE_OF: Record<StandingMark, AccordionItemState> = {
  met: 'done',
  open: 'empty',
  owed: 'errors',
};

/**
 * The list's sections from the words. An open part shows no standing — its fields say what it
 * holds — unless something in it is owed (`m-failed-save`): the list opens an owed part itself and
 * keeps its word, and a part that lost its mark on opening would be opened again each time the
 * owner left it, locking every other part shut.
 */
export function profileItems(
  words: Pick<CompanyProfileWords, 'parts'>,
  open: CompanyProfilePart | null,
  fieldsOf: (part: CompanyProfilePart) => ReactNode,
): AccordionItem[] {
  return words.parts.map((part) => ({
    key: part.key,
    title: part.title,
    content: fieldsOf(part.key),
    ...(part.key === open && part.mark !== 'owed'
      ? {}
      : { state: STATE_OF[part.mark], stateLabel: part.standing }),
  }));
}

/** The part the list reports as open: it holds one section open at a time, or none. */
export function openedPart(reported: string | string[] | null): CompanyProfilePart | null {
  const key = Array.isArray(reported) ? reported[0] : reported;
  return COMPANY_PROFILE_PARTS.find((part) => part === key) ?? null;
}

/** The failed read's glyph on a 24-unit square (`m-error`): a ringed mark, one drawing for both halves. */
export const UNREAD_GLYPH: readonly GlyphMark[] = [
  { kind: 'circle', cx: 12, cy: 12, r: 9 },
  { kind: 'path', d: 'M12 7.5v5' },
  { kind: 'path', d: 'M12 16.25h.01' },
];
/** The glyph's drawn size, as `m-error` draws it inside the message's disc. */
export const UNREAD_GLYPH_SIZE = 28;

/** The bloom behind the letterhead's sheet (`d-default`): art, never layout. */
export const LETTERHEAD_BLOOM_SIZE = 760;
/** The lines of a letter under the letterhead, as `d-default` draws them: two paragraphs of bars. */
export const LETTER_PARAGRAPHS = [4, 2] as const;

/** One field of a part: what it asks, what it holds, and the line a reader depends on under it. */
export interface ProfileFieldSpec {
  readonly field: CompanyProfileField;
  readonly label: string;
  readonly value: string;
  /** An example shown while the field is empty. */
  readonly example: string | undefined;
  /** An identifier is set in the mono face. */
  readonly mono: boolean;
  /** Where the value came from, or what was checked — read under the field. */
  readonly line: string | null;
  /** Why what is typed does not read as the field's fact; it takes the line's place. */
  readonly error: string | null;
}

/**
 * A part's fields in the screen's order, the disclosure that stands under them, and the last line
 * that says what the part is for.
 */
export interface ProfileSetSpec {
  readonly fields: readonly ProfileFieldSpec[];
  readonly disclosure: string | null;
  readonly purpose: string | null;
}

type FieldFacts = Pick<ProfileFieldSpec, 'field' | 'label'> & Partial<ProfileFieldSpec>;

/**
 * What a part asks in text fields (`SCR-M01-05`), one answer both halves draw. What you sell is
 * cards and a figure, not text: it returns none, and each half draws it from the same words.
 */
export function profileSet(
  part: CompanyProfilePart,
  words: Pick<CompanyProfileWords, 'identity' | 'address' | 'tax' | 'bank'>,
  values: CompanyProfileValues,
): ProfileSetSpec | null {
  const { identity, address, tax, bank } = words;
  const asked = (facts: FieldFacts): ProfileFieldSpec => ({
    value: values[facts.field],
    example: undefined,
    mono: false,
    line: null,
    error: null,
    ...facts,
  });
  if (part === 'identity') {
    return {
      fields: [
        asked({ field: 'companyName', label: identity.companyName, line: identity.fromSignup }),
      ],
      disclosure: null,
      purpose: null,
    };
  }
  if (part === 'address') {
    return {
      fields: [
        asked({ field: 'address', label: address.street, example: address.streetExample }),
        asked({ field: 'city', label: address.city, line: address.fromSignup }),
        asked({
          field: 'postalCode',
          label: address.postalCode,
          example: address.postalCodeExample,
          mono: true,
        }),
      ],
      disclosure: null,
      purpose: address.purpose,
    };
  }
  if (part === 'tax') {
    return {
      fields: [
        asked({
          field: 'taxRegistration',
          label: tax.label,
          mono: true,
          line: tax.error === null ? tax.format : null,
          error: tax.error,
        }),
      ],
      disclosure: tax.checked,
      purpose: null,
    };
  }
  if (part === 'bank') {
    return {
      fields: [
        asked({ field: 'bankName', label: bank.bankName, example: bank.bankNameExample }),
        asked({ field: 'accountName', label: bank.accountHolder }),
        asked({
          field: 'accountNumber',
          label: bank.accountNumber,
          example: bank.accountNumberExample,
          mono: true,
        }),
        asked({
          field: 'bankRoutingIdentifier',
          label: bank.routing,
          example: bank.routingExample,
          mono: true,
          line: bank.checked,
        }),
      ],
      disclosure: null,
      purpose: bank.purpose,
    };
  }
  return null;
}

/**
 * The typical size's field (`m-declarations-open`), one answer both halves draw. It reports as
 * typed, because the act is pressed without leaving it; a stepper never takes it under nothing;
 * and only a figure domain reads as a declaration carries the tier — a 0 or an empty box has no
 * figure a tier could qualify (`F8-01`), and the part's header already reads it as not declared.
 */
export function sizeField(
  words: CompanyProfileWords['declarations'],
  values: Pick<CompanyProfileValues, 'typicalSystemKwp'>,
): Omit<NumberFieldProps, 'onCommit'> {
  return {
    label: words.sizeLabel,
    unit: words.unit,
    value: values.typicalSystemKwp ?? undefined,
    min: 0,
    step: TYPICAL_SYSTEM_KWP.step,
    precision: TYPICAL_SYSTEM_KWP.precision,
    hint: words.sizeHint,
    provenance: isTypicalSystemSize(values.typicalSystemKwp)
      ? { tier: 'estimated', source: words.sizeSource, emphasis: 'load-bearing' }
      : 'unmarked',
    commits: 'as-typed',
  };
}
