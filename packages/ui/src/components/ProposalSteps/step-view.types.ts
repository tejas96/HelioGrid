import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BankDetails,
  ComponentCategory,
  ProjectChainStage,
  ProposalFieldSet,
  ProposalVersionSnapshot,
  ProvenanceTier,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type {
  ProposalBankBlockProps,
  ProposalGenerationBlockProps,
  ProposalPartsBlockProps,
  ProposalPriceBlockProps,
  ProposalSavingsBlockProps,
  ProposalSplitBlockProps,
} from '../ProposalBlocks/ProposalBlocks.types';
import type {
  BankStepView,
  ClientAreaOption,
  ClientStepView,
  CompanyStepView,
  ComponentsStepView,
  FinancialsStepView,
  PaymentStepView,
  PerformanceStepView,
  SystemStepView,
  TermsStepView,
  TimelineStepView,
  TrackRecordStepView,
} from './ProposalSteps.parts.types';
import type { CoverChoice, ProposalStepView } from './ProposalSteps.types';

/**
 * What a step's view is joined from (`step-view.ts`): its model — what the pair's `packages/data`
 * hook assembles, values and one callback per commit, no words — and what `packages/i18n` said of
 * the same step.
 */

type Bare<View, Drop extends keyof View = never> = Omit<View, 'words' | Drop>;

export type ProposalStepModel =
  | (Bare<CompanyStepView, 'covers' | 'peek' | 'facts'> & {
      readonly covers: readonly Omit<CoverChoice, 'name'>[];
      readonly facts: readonly { readonly key: string; readonly value: string }[];
    })
  | Bare<TrackRecordStepView, 'about'>
  | (Bare<SystemStepView, 'price' | 'batteryNotice' | 'noTax'> & {
      readonly batteryNeeded: 'danger' | 'warning' | null;
      readonly onPickBattery: () => void;
      readonly noTax: boolean;
    })
  | (Bare<PerformanceStepView, 'generation' | 'capacityChanged'> & {
      readonly capacityChanged: boolean;
    })
  | Bare<FinancialsStepView, 'savings'>
  | Bare<TimelineStepView>
  | (Bare<PaymentStepView, 'split' | 'parts' | 'onNewPlan'> & {
      readonly parts: readonly {
        readonly key: string;
        /** biome-ignore lint/plugin/copy-prop-type: a fact — the company's own name for the part */
        readonly label: string;
        readonly dueOnStage: ProjectChainStage;
        readonly percent: number;
      }[];
    })
  | (Bare<ComponentsStepView, 'parts'> & {
      readonly categories: readonly ComponentCategory[];
      readonly onPick: (category: ComponentCategory) => void;
    })
  | (Bare<TermsStepView, 'maxLength' | 'defaultFailure'> & {
      readonly printsIn: string | null;
      /** The last *Save as company default*'s failure, as the view model holds it. */
      readonly defaultFailure: unknown;
    })
  | (Bare<ClientStepView, 'phone' | 'area' | 'facts'> & {
      readonly area: { readonly area: string; readonly district: string | null } | null;
      readonly onArea: (area: { area: string; district: string | null }) => void;
      /** No state, and Generate was asked for: the State field says so. */
      readonly areaMissing: boolean;
      /** The customer's number as E.164; the view groups it (`phoneText`). */
      readonly phone?: string;
    })
  | (Bare<BankStepView, 'bank'> & { readonly mayEdit: boolean });

type Notice = { readonly title: TranslatedText; readonly line: TranslatedText };
type WordsOf<Step extends ProposalStepView['step']> = Extract<
  ProposalStepView,
  { step: Step }
>['words'];

/** The step's words and the few lines its view builds from them, keyed by the step they are for. */
export type ProposalStepSaid =
  | {
      readonly step: 'company';
      readonly words: WordsOf<'company'>;
      readonly covers: Readonly<Record<string, TranslatedText>>;
      readonly factLabels: Readonly<Record<string, TranslatedText>>;
      /** A number as the market groups it — `+91 99999 98801`. */
      readonly phoneText: (e164: string) => string;
    }
  | { readonly step: 'achievements'; readonly words: WordsOf<'achievements'> }
  | {
      readonly step: 'system';
      readonly words: WordsOf<'system'>;
      readonly battery?: Notice & { readonly act: TranslatedText };
      readonly noTax?: Notice;
    }
  | {
      readonly step: 'performance';
      readonly words: WordsOf<'performance'>;
      readonly capacityChanged: Notice & { readonly act: TranslatedText };
    }
  | { readonly step: 'financials'; readonly words: WordsOf<'financials'> }
  | { readonly step: 'timeline'; readonly words: WordsOf<'timeline'> }
  | {
      readonly step: 'payment';
      readonly words: WordsOf<'payment'>;
      readonly due: (stage: ProjectChainStage) => TranslatedText;
    }
  | { readonly step: 'components'; readonly words: WordsOf<'components'> }
  | { readonly step: 'terms'; readonly words: WordsOf<'terms'> }
  | {
      readonly step: 'client';
      readonly words: WordsOf<'client'>;
      readonly number: { readonly label: TranslatedText; readonly value: string };
      readonly language: { readonly label: TranslatedText; readonly value: string };
      /** The customer's number as the market groups it. */
      readonly phoneText: (e164: string) => string;
    }
  | { readonly step: 'bank'; readonly words: WordsOf<'bank'> };

/** What a view takes beside its model and its words: the document's value set and the blocks' words. */
export interface StepViewParts {
  /** A refused value's reason in words (`F8-36`); without it a refusal reads as not saved. */
  readonly refusal?: (failure: unknown) => TranslatedText | null;
  /** The document's value set; `null` while no price is typed. */
  readonly snapshot: ProposalVersionSnapshot | null;
  /** The steps as the person left them — there before any price is typed. */
  readonly fields: ProposalFieldSet;
  /** The company's account as the document prints it; `null` while it holds none. */
  readonly bank: BankDetails | null;
  readonly blocks: {
    readonly price: ProposalPriceBlockProps['words'];
    readonly generation: ProposalGenerationBlockProps['words'];
    readonly savings: ProposalSavingsBlockProps['words'];
    readonly split: ProposalSplitBlockProps['words'];
    readonly bank: ProposalBankBlockProps['words'];
  };
  readonly parts: ProposalPartsBlockProps['words'];
  readonly generationTier: ProvenanceTier;
  /** The phone's peek of the cover on step 1. */
  /** `null` while no price is typed: no page draws yet, so no peek is drawn. */
  readonly peek?: { readonly page: ReactNode | null; readonly onOpen: () => void };
  /** The market's regions, for step 10. */
  readonly areas: readonly ClientAreaOption[];
}

export type ModelOf<Step extends ProposalStepModel['step']> = Extract<
  ProposalStepModel,
  { step: Step }
>;
export type SaidOf<Step extends ProposalStepSaid['step']> = Extract<
  ProposalStepSaid,
  { step: Step }
>;
