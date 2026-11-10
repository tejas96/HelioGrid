import type { TranslatedText } from '@heliogrid/contracts';
import type {
  MergeField,
  MergeMove,
  MergeOption,
  MergeRecordView,
  MergeView,
} from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type {
  MergeCompareOption,
  MergeCompareProps,
  MergeCompareRecord,
  MergeCompareValue,
} from './MergeCompare.types';

/** The mark beside each field the compare asks a pick for. */
export const MERGE_FIELD_GLYPH: Record<MergeField, ShellGlyphName> = {
  name: 'person',
  city: 'pin',
  primary_contact: 'phone',
};

/** The mark beside each kind of record a merge moves. */
export const MERGE_MOVE_GLYPH: Record<MergeMove, ShellGlyphName> = {
  contacts: 'people',
  leads: 'user',
  activities: 'list-bullet',
  referrals: 'link',
  visits: 'calendar',
  tasks: 'calendar-check',
  files: 'file',
};

/** The words `mergeCompareOf` puts beside the view's facts, built in `@heliogrid/i18n`. */
export interface MergeCompareViewWords {
  readonly field: (field: MergeField) => TranslatedText;
  /** "From Sunita Kulkarni" — the record a value is taken from, by its name or its number. */
  readonly from: (name: string) => TranslatedText;
  readonly noName: TranslatedText;
  readonly noCity: TranslatedText;
  /** Under the primary contact: the other number stays on as a contact. */
  readonly numberKept: TranslatedText;
}

/**
 * The compare's records and fields from domain's view of the pair: each value as typed, or its
 * named gap — a primary contact that is the customer themself shows their own number.
 */
export function mergeCompareOf(
  view: MergeView,
  words: MergeCompareViewWords,
  phone: (phoneE164: string) => string,
): Pick<MergeCompareProps, 'records' | 'fields'> {
  const [first, second] = view.records;
  const recordOf = (record: MergeRecordView): MergeCompareRecord => ({
    customerId: record.customerId,
    name: record.name,
    phone: phone(record.phoneE164),
    city: record.city,
    stays: record.stays,
  });
  const shownValue = (field: MergeField, option: MergeOption): MergeCompareValue => {
    if (option.value !== null) return { kind: 'fact', text: option.value, mono: false };
    if (field === 'primary_contact') {
      return { kind: 'fact', text: phone(option.phoneE164), mono: true };
    }
    return { kind: 'gap', words: field === 'name' ? words.noName : words.noCity };
  };
  const optionOf = (field: MergeField, option: MergeOption): MergeCompareOption => ({
    customerId: option.customerId,
    value: shownValue(field, option),
    from: words.from(option.fromName ?? phone(option.phoneE164)),
  });
  return {
    records: [recordOf(first), recordOf(second)],
    fields: view.fields.map((pick) => ({
      key: pick.field,
      label: words.field(pick.field),
      options: [optionOf(pick.field, pick.options[0]), optionOf(pick.field, pick.options[1])],
      pickedId: pick.pickedId,
      note: pick.field === 'primary_contact' && view.keptNumber !== null ? words.numberKept : null,
    })),
  };
}
