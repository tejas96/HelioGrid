import type { CatalogImportAttentionReason, CatalogImportRowFailure } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { catalogImportWordsBase } from './catalog-import';

type T = Translator['t'];

/** What a row's question or reason names (`SCR-M01-17`). */
export interface ImportRowWordsFacts {
  readonly product: string;
  readonly named: string | null;
  readonly conflict: {
    readonly field: string;
    readonly file: string;
    readonly catalog: string;
  } | null;
  readonly priceText: string;
  readonly repeat: { readonly row: number; readonly price: string | null } | null;
  readonly unit: string | null;
}

const SUB = {
  override: /*i18n*/ { id: 'Row {row} · matched to {product}' },
  own: /*i18n*/ { id: 'Row {row} · matched to your {product}' },
  new: /*i18n*/ { id: 'Row {row} · no match — it becomes your own SKU' },
  notCreated: /*i18n*/ { id: 'Row {row} · no match — not created' },
  matches: /*i18n*/ { id: 'Row {row} · matches {product}' },
  several: /*i18n*/ { id: 'Row {row} · several products match' },
  plain: /*i18n*/ { id: 'Row {row}' },
} as const;

/** Each question a card asks, as the board words it. */
const ASK: Record<CatalogImportAttentionReason, { id: string }> = {
  brand_or_model_missing: /*i18n*/ {
    id: 'This row names no brand or model — fix it in your file, or leave it out.',
  },
  kind_missing: /*i18n*/ { id: 'We cannot tell what kind of item this is — what is it?' },
  price_missing: /*i18n*/ { id: 'The price is empty — what does it cost you?' },
  price_unreadable: /*i18n*/ { id: 'The price reads “{text}” — what does it cost you?' },
  price_below_zero: /*i18n*/ { id: 'The price reads {text} — below zero. What does it cost you?' },
  price_finer_than_minor_unit: /*i18n*/ {
    id: 'The price reads {text} — finer than your currency allows. What does it cost you?',
  },
  spec_missing: /*i18n*/ {
    id: 'Some specs this new product needs are missing — fix them in your file, or leave it out.',
  },
  spec_invalid: /*i18n*/ {
    id: 'Some specs of this new product do not read — fix them in your file, or leave it out.',
  },
  spec_conflict: /*i18n*/ {
    id: 'Your file says {file}; the product we carry is {catalog} — which is right?',
  },
  several_matches: /*i18n*/ { id: 'Several products we carry match this row — which one is it?' },
  repeated_in_file: /*i18n*/ {
    id: 'Row {row} has the same item at {price} — which price is right?',
  },
};

/** The price question with the unit the file sells by: *what does one metre cost you?* */
const ASK_PER_UNIT = {
  price_missing: /*i18n*/ { id: 'The price is empty — what does one {unit} cost you?' },
  price_unreadable: /*i18n*/ { id: 'The price reads “{text}” — what does one {unit} cost you?' },
} as const;

const ASK_REPEAT_UNPRICED = /*i18n*/ {
  id: 'Row {row} has the same item — which price is right?',
};

/** Each reason a left-out row gives in the report. */
const REASON: Record<CatalogImportAttentionReason, { id: string }> = {
  brand_or_model_missing: /*i18n*/ { id: 'The row named no brand or model. Nothing was created.' },
  kind_missing: /*i18n*/ {
    id: 'We could not tell what kind of item this was. Nothing was created.',
  },
  price_missing: /*i18n*/ { id: 'The price cell was empty. Nothing was changed for this item.' },
  price_unreadable: /*i18n*/ {
    id: 'The price read “{text}” — not a number. Nothing was changed for this item.',
  },
  price_below_zero: /*i18n*/ {
    id: 'The price read {text} — below zero. Nothing was changed for this item.',
  },
  price_finer_than_minor_unit: /*i18n*/ {
    id: 'The price read {text} — finer than your currency allows. Nothing was changed for this item.',
  },
  spec_missing: /*i18n*/ {
    id: 'Some specs of this new product were missing. Nothing was created.',
  },
  spec_invalid: /*i18n*/ {
    id: 'Some specs of this new product did not read. Nothing was created.',
  },
  spec_conflict: /*i18n*/ {
    id: 'Your file said {file}; the product we carry is {catalog}. Nothing was changed for this item.',
  },
  several_matches: /*i18n*/ {
    id: 'Several products we carry matched this row. Nothing was created.',
  },
  repeated_in_file: /*i18n*/ {
    id: 'Row {row} had the same item at {price}. Nothing was changed for this item.',
  },
};

const FAILURE: Record<CatalogImportRowFailure, { id: string }> = {
  changed_since_preview: /*i18n*/ {
    id: 'This product changed in your catalog after the preview, so the row was not written.',
  },
  not_applied: /*i18n*/ { id: 'Your catalog could not be reached, so the row was not written.' },
};

const LEFT_OUT_BY_YOU = /*i18n*/ {
  id: 'You left this row out. Nothing was changed for this item.',
};

const FIXED = {
  price: /*i18n*/ { id: 'Price set to {value} — ready to import.' },
  answer: /*i18n*/ { id: 'Answered — ready to import.' },
  kind: /*i18n*/ { id: 'Kind set to {value} — ready to import.' },
  pick: /*i18n*/ { id: '{value} chosen — ready to import.' },
  repeat: /*i18n*/ { id: 'This row’s price is used — ready to import.' },
  leftOut: /*i18n*/ { id: 'Left out — nothing changes for this item.' },
} as const;

export type ImportRowSubKind = keyof typeof SUB;

function asked(t: T, reason: CatalogImportAttentionReason, facts: ImportRowWordsFacts): string {
  const text = facts.priceText;
  if ((reason === 'price_missing' || reason === 'price_unreadable') && facts.unit !== null) {
    return t(ASK_PER_UNIT[reason], { text, unit: facts.unit });
  }
  if (reason === 'repeated_in_file' && facts.repeat?.price === null) {
    return t(ASK_REPEAT_UNPRICED, { row: facts.repeat.row });
  }
  return t(ASK[reason], {
    text,
    file: facts.conflict?.file ?? '',
    catalog: facts.conflict?.catalog ?? '',
    row: facts.repeat?.row ?? 0,
    price: facts.repeat?.price ?? '',
  });
}

/** The row words: a row's sub-line, its question, its report reason and what its fix set. */
export function catalogImportRowWords(t: T) {
  return {
    rowSub: (row: number, product: string | null, kind: ImportRowSubKind) =>
      t(SUB[product === null && (kind === 'matches' || kind === 'override') ? 'plain' : kind], {
        row,
        product: product ?? '',
      }),
    question: (reason: CatalogImportAttentionReason, facts: ImportRowWordsFacts) =>
      asked(t, reason, facts),
    reason: (
      facts: ImportRowWordsFacts & {
        readonly attention: CatalogImportAttentionReason | null;
        readonly failure: CatalogImportRowFailure | null;
      },
    ) => {
      if (facts.failure !== null) return t(FAILURE[facts.failure]);
      if (facts.attention === null) return t(LEFT_OUT_BY_YOU);
      return t(REASON[facts.attention], {
        text: facts.priceText,
        file: facts.conflict?.file ?? '',
        catalog: facts.conflict?.catalog ?? '',
        row: facts.repeat?.row ?? 0,
        price: facts.repeat?.price ?? '',
      });
    },
    fixedLine: (fix: keyof typeof FIXED, value: string | null) =>
      t(FIXED[fix], { value: value ?? '' }),
  };
}

/** Every word of the import wizard (`SCR-M01-17`), fixed and built from facts. */
export function catalogImportWords(t: T) {
  return { ...catalogImportWordsBase(t), ...catalogImportRowWords(t) };
}
