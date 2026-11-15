import type { TranslatedText } from '@heliogrid/contracts';
import {
  customerShortNameOf,
  type DealSegment,
  type MinorUnits,
  type ProposalDraftValueSet,
  type ProposalFieldSet,
  type ProposalPage,
  type ProposalVersionSnapshot,
  proposalSheetsOf,
  sheetNumber,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import {
  proposalBuilderWords,
  proposalStepListWords,
  proposalStepNames,
} from './proposal-builder-frame';
import { proposalFieldRefusalWords } from './proposal-builder-refusals';
import {
  type BuilderSaidStep,
  proposalBuilderScreenWords,
  proposalBuilderStepSaid,
} from './proposal-builder-screen';
import { proposalStepWords } from './proposal-builder-steps';
import { proposalBuilderBlockWords, proposalDraftBlockWords } from './proposal-document-builder';
import { proposalCoverWords } from './proposal-document-cover';
import { proposalPageWords } from './proposal-document-pages';
import { proposalPartsWords } from './proposal-parts';
import { type ProposalActFailureLike, proposalActFailureWords } from './proposal-screens-words';

/**
 * Everything the builder says, built ONCE over the screen's own facts (Law 11): the frame's and the
 * steps' words, the step in view, the document's words for the page a step feeds, and the check
 * before Generate. The web and the phone both call these two functions with the same view model,
 * so neither words the builder on its own.
 */
type T = Translator['t'];

const ENERGY_SOURCE = 'PVGIS';
/* A scheme's key is its own statutory name (`ALMM`, `DCR`): never translated. */
const schemeName = (scheme: string): string => scheme;

/** How the caller prints the company's figures: `packages/ui`'s `useFormat`, bound to the pack. */
export interface BuilderSaidFormat {
  readonly number: (value: number) => string;
  readonly amountPlain: (amount: MinorUnits, beside?: readonly MinorUnits[]) => string;
  readonly phone: (value: string) => string;
  readonly date: (value: string) => string;
  readonly monthNames: readonly string[];
  readonly routingLabel: string;
}

/** The frame's facts as `packages/data` assembled them, by shape. */
export interface BuilderSaidFrame {
  readonly customerName: string;
  /** The deal's segment: a business is called by its whole name (`customerShortNameOf`). */
  readonly segment: DealSegment | null;
  readonly city: string | null;
  readonly quick: boolean;
  readonly payableText: string | null;
  readonly recomputing: boolean;
  readonly page: ProposalPage;
  readonly pages: readonly ProposalPage[];
  readonly pageAt: number | null;
  readonly snapshot: ProposalVersionSnapshot | null;
  /** The value set before a price is typed: the cover's words read it from step 1. */
  readonly valueSet: ProposalDraftValueSet;
  readonly fieldSet: ProposalFieldSet;
  readonly taxName: string;
}

/**
 * The sheets the document prints as the draft stands — the terms take as many as their plan does
 * (`M06-15`) — so every "N pages" line counts what prints, and the page in view its own place.
 */
export function builderSheets(
  frame: Pick<BuilderSaidFrame, 'pages' | 'page' | 'pageAt' | 'fieldSet'>,
) {
  const sheets = proposalSheetsOf(frame.pages, frame.fieldSet);
  const at = frame.pageAt === null ? 0 : sheetNumber(sheets, frame.page, 0);
  return { count: sheets.length, at: at === 0 ? null : at };
}

export interface BuilderSaidInput {
  readonly frame: BuilderSaidFrame;
  /** The proposal's document as the server answered it; `null` until it is read. */
  readonly document: {
    readonly language: string;
    readonly company: { readonly name: string };
  } | null;
  /** Who may change the company's facts; `null` until the proposal is read. */
  readonly rights: {
    readonly rights: { readonly writesCompanyFacts: boolean };
    readonly companyFactsBy?: { readonly name: string } | null;
  } | null;
  readonly format: BuilderSaidFormat;
}

/** `packages/ui`'s bound format as these words take it. */
export function builderSaidFormatOf(format: {
  readonly number: BuilderSaidFormat['number'];
  readonly amountPlain: BuilderSaidFormat['amountPlain'];
  readonly phone: BuilderSaidFormat['phone'];
  readonly date: BuilderSaidFormat['date'];
  readonly monthNames: (style: 'short') => readonly string[];
  readonly pack: { readonly bankRoutingLabel: string };
}): BuilderSaidFormat {
  return {
    number: format.number,
    amountPlain: format.amountPlain,
    phone: format.phone,
    date: format.date,
    monthNames: format.monthNames('short'),
    routingLabel: format.pack.bankRoutingLabel,
  };
}

type PerformanceFacts = Extract<BuilderSaidStep, { step: 'performance' }>;
/** The step in view as its model states it; whether its months were edited is the field set's to say. */
export type BuilderStepFacts =
  | Exclude<BuilderSaidStep, PerformanceFacts>
  | Omit<PerformanceFacts, 'edited'>;

export function proposalBuilderSaid(t: T, input: BuilderSaidInput) {
  const { frame, format } = input;
  const sheets = builderSheets(frame);
  /* Named only for a viewer who cannot change the company's facts themself. */
  const owner =
    input.rights?.rights.writesCompanyFacts === true
      ? undefined
      : (input.rights?.companyFactsBy?.name ?? undefined);
  const name = customerShortNameOf(frame.customerName, frame.segment);
  const words = proposalBuilderWords(t, { name, fullName: frame.customerName });
  const wordsFormat = { number: format.number, amount: format.amountPlain, phone: format.phone };
  const pageInput =
    frame.snapshot === null
      ? null
      : { snapshot: frame.snapshot, format: wordsFormat, taxName: frame.taxName, schemeName };
  const pageWords = pageInput === null ? null : proposalPageWords(t, pageInput);
  const coverWords =
    pageWords ??
    proposalCoverWords(t, {
      snapshot: frame.valueSet,
      format: wordsFormat,
      taxName: frame.taxName,
    });
  const blocks =
    pageInput === null
      ? proposalDraftBlockWords(t, {
          fields: frame.fieldSet,
          customerName: frame.customerName,
          segment: frame.segment,
          companyName: input.document?.company.name ?? '',
          format: wordsFormat,
          taxName: frame.taxName,
          schemeName,
        })
      : proposalBuilderBlockWords(t, pageInput);
  const partsWords = proposalPartsWords(t, { schemeName, numberText: format.number });
  const saidOf = (step: BuilderStepFacts, termsEstimate?: { pages: number; chars: number }) =>
    proposalBuilderStepSaid(
      t,
      {
        name,
        ...(owner === undefined ? {} : { owner }),
        taxName: frame.taxName,
        routingLabel: format.routingLabel,
        energySource: ENERGY_SOURCE,
        snapshot: frame.snapshot,
        monthNames: format.monthNames,
        format: { amount: format.amountPlain, number: format.number, phone: format.phone },
        ...(termsEstimate === undefined ? {} : { termsEstimate }),
        due: blocks.split.due,
      },
      step.step === 'performance'
        ? { ...step, edited: frame.fieldSet.performance.editedMonthlyKwh !== null }
        : step,
    );
  return {
    name,
    words,
    names: proposalStepNames(t),
    screenWords: proposalBuilderScreenWords(t, {
      name: frame.customerName,
      city: frame.city,
      language: input.document?.language ?? '',
    }),
    shared: proposalStepWords(t),
    list: proposalStepListWords(t, { quick: frame.quick }),
    pageWords,
    /** The cover's words, there before any price is typed (`M06-51`). */
    coverWords,
    blocks,
    partsWords,
    /** The cover's own line, which the preview shows on a step whose page waits for a price. */
    coverLine: words.pageLine(1, sheets.count, coverWords.titles.cover),
    /** `Page 6 of 9 · Price and payment`; nothing while no price is typed, but for the cover. */
    pageLine:
      frame.page === 'cover'
        ? words.pageLine(sheets.at, sheets.count, coverWords.titles.cover)
        : pageWords === null
          ? null
          : words.pageLine(sheets.at, sheets.count, pageWords.titles[frame.page]),
    /**
     * The payable as the frame prints it: the server's figure, or — while a save is out — that it
     * is updating, so the old figure never reads as current (`T-M06-005`). `null` with no price yet.
     */
    payable:
      frame.payableText === null
        ? null
        : { label: words.pays, text: frame.recomputing ? words.updating : frame.payableText },
    saidOf,
    /** Why the server refused a field's value, said at the field (`F8-36`). */
    refusal: (failure: unknown): TranslatedText | null =>
      proposalFieldRefusalWords(t, failure) ??
      proposalActFailureWords(t, failure as ProposalActFailureLike),
  };
}

export type ProposalBuilderSaid = ReturnType<typeof proposalBuilderSaid>;
