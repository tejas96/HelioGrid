import {
  type AllocationVerdict,
  authoredIn,
  type DisplayVocabulary,
  isSkippableStage,
  PROJECT_STAGE_CHAIN,
  type ProjectChainStage,
  packLabel,
  percentToBasisPoints,
  shareOfBasisPoints,
  shareTextOf,
  stageLabel,
  type TrancheCard,
  type TrancheDraft,
  type TrancheLineRead,
  type TrancheRefusals,
  type UiLanguage,
} from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { brandingCoverProps, brandingDocumentOf } from '../BrandingSettings/BrandingSettings.logic';
import type { DocumentPreviewProps } from '../DocumentPreview/DocumentPreview.types';
import type {
  PaymentTermsCardView,
  PaymentTermsFootProps,
  PaymentTermsLetterhead,
  PaymentTermsLineView,
  PaymentTermsPreviewView,
  PaymentTermsSettingsWords,
  PaymentTermsStageView,
} from './PaymentTermsSettings.types';

/** The sheet the preview prints on, and how tall its window stands in each editor (`SCR-M01-20`). */
export const TERMS_PREVIEW = {
  width: 480,
  minScale: 0.6,
  sheetHeight: 150,
  cardHeight: 220,
} as const;

/** Each stage's glyph on the picker's rail, as the board draws it. */
const STAGE_GLYPH: Record<ProjectChainStage, ShellGlyphName> = {
  won: 'circle-check',
  material_ordered: 'cart',
  dispatched: 'truck',
  installation: 'wrench',
  electrical_metering: 'bolt',
  utility_inspection: 'shield-check',
  commissioned: 'sun',
  incentive_claimed: 'file-text',
  handed_over: 'key',
};

/** What the page's views read besides the page itself: the words, the language and the pack. */
export interface PaymentTermsContext {
  readonly words: PaymentTermsSettingsWords;
  readonly language: UiLanguage;
  readonly vocabulary: DisplayVocabulary;
  /** Each stage's short form and *when* sentence (`stageWords`). */
  readonly stages: Readonly<
    Record<ProjectChainStage, { readonly short: string; readonly when: string }>
  >;
  /** A decimal amount the api sent, in the tenant's money. */
  money(amount: string): string;
}

/** The context both screens build: the words, the language, and the market's format bound to them. */
export function termsContextOf(
  words: PaymentTermsSettingsWords,
  stages: PaymentTermsContext['stages'],
  language: UiLanguage,
  format: {
    readonly pack: { readonly vocabulary: DisplayVocabulary };
    money(amount: string): string;
  },
): PaymentTermsContext {
  return {
    words,
    language,
    vocabulary: format.pack.vocabulary,
    stages,
    money: (amount) => format.money(amount),
  };
}

/** A stage as the pack names it; the canonical name is the data's, never shown (`F1-22`). */
function stageNameOf(context: PaymentTermsContext, stage: ProjectChainStage): string {
  const label = stageLabel(context.vocabulary, stage);
  return label === null ? '' : packLabel(label, context.language);
}

export function termsCardsOf(
  cards: readonly TrancheCard[],
  openId: string | null,
  context: PaymentTermsContext,
): PaymentTermsCardView[] {
  return cards.map((card) => {
    const name = authoredIn(card.name, context.language).value;
    return {
      id: card.id,
      name,
      label: context.words.cardLabel(name, card.isDefault),
      isDefault: card.isDefault,
      platformStandard: card.platformStandard,
      selected: card.id === openId,
      parts: card.lines.map((line) => ({
        label: authoredIn(line.label, context.language).value,
        share: Number(line.percent),
        stage: stageNameOf(context, line.dueOnStage),
      })),
    };
  });
}

export function termsLinesOf(
  draft: TrancheDraft,
  refusals: TrancheRefusals,
  shown: boolean,
  context: PaymentTermsContext,
): PaymentTermsLineView[] {
  return draft.lines.map((line) => {
    const refused = shown ? refusals.lines.get(line.key) : undefined;
    return {
      key: line.key,
      name: line.label.shown,
      ...(refused?.label === 'required' ? { nameError: context.words.trancheNameNeeded } : {}),
      ...(line.share === null ? {} : { share: shareOfBasisPoints(line.share) }),
      ...(refused?.share === 'range' ? { shareError: context.words.shareRange } : {}),
      stage: stageNameOf(context, line.dueOnStage),
      skippable: isSkippableStage(context.vocabulary, line.dueOnStage),
    };
  });
}

/** The schedule's rows: each line's name, its stage's sentence, its share and the api's amount. */
export function termsPreviewOf(
  preview: {
    readonly lines: readonly TrancheLineRead[];
    readonly schedule: { readonly contract: string; readonly amounts: readonly string[] } | null;
  } | null,
  context: PaymentTermsContext,
): PaymentTermsPreviewView {
  if (preview === null) return { loading: false, tranches: [], empty: true };
  const { schedule } = preview;
  return {
    loading: schedule === null,
    ...(schedule === null ? {} : { contract: context.money(schedule.contract) }),
    tranches: preview.lines.map((line, index) => ({
      label: authoredIn(line.label, context.language).value,
      when: context.stages[line.dueOnStage].when,
      share: `${shareTextOf(percentToBasisPoints(line.percent))}%`,
      amount: context.money(schedule?.amounts[index] ?? '0'),
    })),
    empty: false,
  };
}

/** The meter in the foot, off the one verdict; its words are `allocationSentence`'s and `allocationRefusal`'s. */
export function termsFootOf(
  draft: TrancheDraft,
  verdict: AllocationVerdict,
): Pick<PaymentTermsFootProps, 'parts' | 'state'> {
  return {
    parts: draft.lines.map((line) => ({
      label: line.label.shown,
      value: shareOfBasisPoints(line.share ?? 0),
    })),
    state: verdict.state,
  };
}

/** The nine stages of the chain, in order, never *Cancelled*; each with the tranches due there. */
export function termsStagesOf(
  draft: TrancheDraft,
  picking: number,
  context: PaymentTermsContext,
): PaymentTermsStageView[] {
  return PROJECT_STAGE_CHAIN.map((stage) => ({
    id: stage,
    label: stageNameOf(context, stage),
    short: context.stages[stage].short,
    glyph: STAGE_GLYPH[stage],
    skippable: isSkippableStage(context.vocabulary, stage),
    pills: draft.lines
      .filter((line) => line.dueOnStage === stage)
      .map((line) => ({
        key: line.key,
        text: context.words.trancheShare(line.label.shown, shareTextOf(line.share ?? 0)),
        mine: line.key === picking,
      })),
  }));
}

/** The picker's two words for a tranche: the group's name and the overline over the sheet or card. */
export function termsPickerWordsOf(
  draft: TrancheDraft,
  picking: number,
  words: Pick<PaymentTermsSettingsWords, 'whenDue' | 'trancheShare'>,
): { readonly label: string; readonly overline: string } {
  const line = draft.lines.find((one) => one.key === picking);
  const name = line?.label.shown ?? '';
  return {
    label: words.whenDue(name),
    overline: words.trancheShare(name, shareTextOf(line?.share ?? 0)),
  };
}

/**
 * The preview's letterhead: the company's branding as Proposal template draws it. Until the
 * branding is read, or when its read fails, the band draws with no letterhead — the schedule is
 * never held back for it.
 */
export function termsLetterheadOf(
  cover: Parameters<typeof brandingDocumentOf>[0],
  colour: string | null,
  taxIdLabel: string,
): PaymentTermsLetterhead {
  return { facts: brandingDocumentOf(cover, taxIdLabel), colour };
}

/** The preview's document: the tenant's letterhead over the schedule alone. */
export function termsDocumentProps(
  letterhead: PaymentTermsLetterhead,
  preview: PaymentTermsPreviewView,
  words: Pick<PaymentTermsSettingsWords, 'schedule' | 'noSchedule' | 'logoAlt'>,
): DocumentPreviewProps {
  const { facts } = letterhead;
  return {
    ...brandingCoverProps(facts, letterhead.colour, {
      documentTitle: words.schedule,
      logoAlt: words.logoAlt(facts.companyName),
    }),
    parts: ['tranches'],
    tranchesTitle: preview.empty ? words.noSchedule : words.schedule,
    tranches: [...preview.tranches],
    fit: 'content',
    width: TERMS_PREVIEW.width,
  };
}
