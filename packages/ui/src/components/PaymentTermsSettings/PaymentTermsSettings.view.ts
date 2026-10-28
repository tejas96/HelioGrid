import {
  type AllocationVerdict,
  isTrancheDueStage,
  type ProjectChainStage,
  type TrancheDraft,
  type TrancheEdit,
  type TrancheLineRead,
  type TrancheRefusals,
} from '@heliogrid/domain';
import {
  type PaymentTermsContext,
  termsFootOf,
  termsLinesOf,
  termsPickerWordsOf,
  termsPreviewOf,
  termsStagesOf,
} from './PaymentTermsSettings.logic';
import type {
  PaymentTermsEditorProps,
  PaymentTermsFootProps,
  PaymentTermsLetterhead,
  PaymentTermsPickerProps,
  PaymentTermsSettingsWords,
} from './PaymentTermsSettings.types';

/** The open editor as `@heliogrid/data`'s `useTrancheTemplates` answers it — read by shape. */
export interface TermsEditorFacts {
  readonly draft: TrancheDraft;
  /** Opened by *Add payment terms*: new until the editor closes, though its first save landed. */
  readonly made: boolean;
  readonly saved: { readonly isDefault: boolean } | null;
  readonly changed: boolean;
  readonly verdict: AllocationVerdict;
  readonly refusals: TrancheRefusals;
  readonly refusalsShown: boolean;
  readonly canAdd: boolean;
  readonly canRemove: boolean;
  readonly saving: boolean;
  readonly saveFailure: unknown;
  readonly preview: {
    readonly lines: readonly TrancheLineRead[];
    readonly schedule: { readonly contract: string; readonly amounts: readonly string[] } | null;
  } | null;
}

/** What the screen does on the editor's acts; the asks and the surfaces stay the screen's. */
export interface TermsEditorActs {
  edit(edit: TrancheEdit): void;
  save(): void;
  makeDefault(id: string): void;
  pickStage(key: number): void;
  askArchive(): void;
  cancel(): void;
}

/** The words the foot says that come off the verdict and the failure — `@heliogrid/i18n`'s. */
export interface TermsEditorSaid {
  /** `allocationSentence`. */
  readonly sentence: string;
  /** `allocationRefusal`; null when the split is whole. */
  readonly refusal: string | null;
  /** The api's words for a save refused by a conflict; absent otherwise. */
  readonly conflict?: string;
}

/** What the open editor draws, on whichever surface holds it — the 375 sheet or the 1536 card. */
export interface TermsEditorView {
  /** The surface's heading: the template's name, or *New payment terms*. */
  readonly title: string;
  /** *Not saved yet* while the draft differs from what was opened. */
  readonly overline?: string;
  readonly body: Omit<PaymentTermsEditorProps, 'previewHeight'>;
  readonly foot: PaymentTermsFootProps;
  /** The stage picker, while a line's *When is it due?* is open. */
  readonly picker: { readonly overline: string; readonly body: PaymentTermsPickerProps } | null;
}

/**
 * The open editor, worded: its body, its foot and — when a line's stage is being picked — the
 * picker. Every fact is the hook's; this only joins it to the parts, once for both apps.
 */
export function termsEditorViewOf(input: {
  readonly editor: TermsEditorFacts;
  readonly context: PaymentTermsContext;
  readonly letterhead: PaymentTermsLetterhead;
  readonly said: TermsEditorSaid;
  readonly picking: number | null;
  readonly acting: 'make-default' | 'archive' | null;
  readonly acts: TermsEditorActs;
}): TermsEditorView {
  const { editor, context, acts } = input;
  const { words } = context;
  const { draft } = editor;
  const id = draft.id;
  return {
    title: editor.made ? words.newTerms : draft.name.shown,
    ...(editor.changed ? { overline: words.notSaved } : {}),
    body: {
      words,
      letterhead: input.letterhead,
      preview: termsPreviewOf(editor.preview, context),
      name: draft.name.shown,
      ...(editor.refusalsShown && editor.refusals.name === 'required'
        ? { nameError: words.termsNameNeeded }
        : {}),
      onName: (text) => acts.edit({ kind: 'name', text }),
      lines: termsLinesOf(draft, editor.refusals, editor.refusalsShown, context),
      canAdd: editor.canAdd,
      canRemove: editor.canRemove,
      onLineName: (key, text) => acts.edit({ kind: 'line-label', key, text }),
      onLineShare: (key, share) => acts.edit({ kind: 'line-share', key, share }),
      onRemove: (key) => acts.edit({ kind: 'remove-line', key }),
      onPickStage: acts.pickStage,
      onAdd: () => acts.edit({ kind: 'add-line', label: words.newTranche(draft.lines.length + 1) }),
      standing: standingOf(editor),
      onMakeDefault: () => {
        if (id !== null) acts.makeDefault(id);
      },
      onArchive: acts.askArchive,
      acting: input.acting,
    },
    foot: {
      words,
      ...termsFootOf(draft, editor.verdict),
      sentence: input.said.sentence,
      ...(input.said.refusal === null ? {} : { refusal: input.said.refusal }),
      saving: editor.saving,
      saveFailed: editor.saveFailure !== null,
      ...(input.said.conflict === undefined ? {} : { saveFailedBody: input.said.conflict }),
      onSave: acts.save,
      onCancel: acts.cancel,
    },
    picker: pickerOf(draft, input.picking, context, acts),
  };
}

function standingOf(editor: TermsEditorFacts): PaymentTermsEditorProps['standing'] {
  if (editor.made) return 'new';
  return editor.saved?.isDefault === true ? 'default' : 'other';
}

function pickerOf(
  draft: TrancheDraft,
  picking: number | null,
  context: PaymentTermsContext,
  acts: TermsEditorActs,
): TermsEditorView['picker'] {
  const line = draft.lines.find((one) => one.key === picking);
  if (line === undefined) return null;
  const said = termsPickerWordsOf(draft, line.key, context.words);
  const pick = (stage: ProjectChainStage) =>
    acts.edit({ kind: 'line-stage', key: line.key, stage });
  return {
    overline: said.overline,
    body: {
      words: context.words,
      label: said.label,
      stages: termsStagesOf(draft, line.key, context),
      value: line.dueOnStage,
      onChange: (stage) => {
        if (isTrancheDueStage(stage)) pick(stage);
      },
    },
  };
}

/** The editor at width: the card that stands beside the cards (the list's `aside`). */
export interface PaymentTermsEditorCardProps {
  readonly view: TermsEditorView;
  readonly words: PaymentTermsSettingsWords;
  /** Back from the picker to the editor — its back button and *Done*. */
  onDonePicking(): void;
}
