import type { TranslatedText } from '@heliogrid/contracts';
import {
  COVER_COUNTS,
  PROPOSAL_TYPES,
  type ProposalType,
  termsFitTheirPages,
} from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { NumberFieldProps } from '../NumberField/NumberField.types';
import type { RichTextProps } from '../RichText/RichText.types';
import type {
  CompanyStepView,
  FieldSave,
  TermsStepView,
  TrackRecordCount,
  TrackRecordStepView,
} from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';

/** One figure of the track record: the field, the word under it, and its last commit. */
export interface TrackRecordCell {
  readonly count: TrackRecordCount;
  readonly field: NumberFieldProps;
  readonly unit: TranslatedText;
  readonly save: FieldSave | undefined;
}

/** Step 2's three figures (`M06-08`, `T-M06-004`): numbers only; each unit is the word under it. */
export function trackRecordCells(
  view: TrackRecordStepView,
  shared: ProposalStepWords,
): TrackRecordCell[] {
  const { words, record } = view;
  return COVER_COUNTS.map((count) => ({
    count,
    unit: words.counts[count],
    save: view.saves?.[count],
    field: {
      steppers: false,
      words: shared.number,
      hero: true,
      plain: true,
      labelSpokenOnly: true,
      label: words.counts[count],
      value: record[count] ?? undefined,
      min: 0,
      precision: 0,
      onCommit: (value) => view.onCount(count, value),
      onClear: () => view.onCount(count, null),
    },
  }));
}

/**
 * What step 9's field last came to: terms that would print past their pages are refused where
 * they are typed (`M06-15`) — the server refuses the save — before any answer says so.
 */
export function termsSave(view: TermsStepView): FieldSave | undefined {
  if (!termsFitTheirPages(view.terms)) return { kind: 'refused', reason: view.words.overPages };
  return view.saves?.terms;
}

/** What the last *Save as company default* came to, said at its button (`T-M06-011`). */
export function termsDefaultSave(view: TermsStepView): FieldSave | undefined {
  if (view.defaultFailure !== undefined) return { kind: 'refused', reason: view.defaultFailure };
  if (view.savingDefault === true) return undefined;
  return view.defaultSaved === true
    ? { kind: 'saved', reason: view.words.defaultSaved }
    : undefined;
}

/** Step 9's one rich-text field (`M06-15`, `T-M06-011`), with its count and page estimate. */
export function termsField(view: TermsStepView): RichTextProps {
  const { words } = view;
  return {
    words: words.richText,
    label: words.label,
    value: view.terms,
    onChange: view.onChange,
    onCommit: view.onCommit,
    minHeight: 190,
    marksOnly: true,
    countOnTop: true,
    ...(view.maxLength === undefined ? {} : { maxLength: view.maxLength }),
    ...(words.estimate === undefined ? {} : { pageEstimate: words.estimate }),
  };
}

const TYPE_GLYPH: Readonly<Record<ProposalType, ShellGlyphName>> = {
  customer_owns: 'house',
  customer_pays_for_power: 'bolt',
};

/** Step 1's first choice (`M06-06`): who owns the system, each option with its glyph. */
export function proposalTypeChoice(view: CompanyStepView) {
  const { words } = view;
  return {
    group: {
      ariaLabel: words.type,
      value: view.proposalType,
      onChange: (type: string) => {
        const known = PROPOSAL_TYPES.find((candidate) => candidate === type);
        if (known !== undefined) view.onProposalType(known);
      },
    },
    options: PROPOSAL_TYPES.map((type) => ({
      value: type,
      title: words.typeOf[type].title,
      description: words.typeOf[type].line,
      glyph: TYPE_GLYPH[type],
    })),
  };
}
