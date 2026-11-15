import type { ProposalDetail, ProposalFieldSetWire } from '@heliogrid/contracts';
import {
  type DealSegment,
  type FormatPack,
  formatMinorUnitsPlainly,
  minorUnitsOfDecimal,
  PROPOSAL_STEPS,
  type ProposalDraftValueSet,
  type ProposalFieldSet,
  type ProposalPage,
  type ProposalStep,
  type ProposalVersionSnapshot,
  presentedSteps,
  QUICK_STEPS,
  STEP_PAGE,
  type StepStanding,
} from '@heliogrid/domain';
import { fieldSetOfDocument } from '../proposals/document-fields';
import { proposalSnapshotOf, proposalValueSetOf } from '../proposals/document-snapshot';
import type { ProposalDraft } from './use-proposal-draft';

/** One step as the frame's rail, track and list draw it. */
export interface BuilderStepFact {
  readonly step: ProposalStep;
  readonly standing: StepStanding;
  /** Quick mode hides it: the list still offers it, quietly (`M06-18`). */
  readonly quiet: boolean;
}

/** What the draft's last commit came to, as the frame says it once (`T-M06-023`). */
export type BuilderSaveState =
  | { readonly kind: 'saved' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'unsaved'; readonly count: number }
  | { readonly kind: 'offline' }
  | { readonly kind: 'conflict' };

/** The frame around every step (`M06-21`, `M06-24`, `T-M06-002`). */
export interface BuilderFrame {
  /** Every step, the ones Quick mode hides included. */
  readonly allSteps: readonly BuilderStepFact[];
  /** The steps presented, in order — four in Quick mode. */
  readonly steps: readonly BuilderStepFact[];
  readonly current: ProposalStep;
  readonly quick: boolean;
  readonly save: BuilderSaveState | null;
  /** The payable as the server last worked it out; `null` while no price is typed. */
  readonly payableText: string | null;
  /** A commit is out: the figures on screen are about to move, so none reads as current (`F8-12`). */
  readonly recomputing: boolean;
  /** How many things stop Generate. */
  readonly toFix: number;
  readonly customerName: string;
  /** The deal's segment: a business is called by its whole name. */
  readonly segment: DealSegment | null;
  readonly city: string | null;
  /** The document page the step in view feeds, and where it sits among the pages printed. */
  readonly page: ProposalPage;
  readonly pages: readonly ProposalPage[];
  /** Zero-based; `null` where the company's pages setting leaves this page out. */
  readonly pageAt: number | null;
  /** The document's one value set, for the stage, the preview and the step's own block. */
  readonly snapshot: ProposalVersionSnapshot | null;
  /** The same value set with the money absent until a price is typed: the cover draws it from step 1. */
  readonly valueSet: ProposalDraftValueSet;
  /** The steps as the person left them, in domain's shape — there before any price is typed. */
  readonly fieldSet: ProposalFieldSet;
  /** The tax scheme's name — `GST` — from the market pack; empty until it is read. */
  readonly taxName: string;
}

function saveOf(draft: ProposalDraft): BuilderSaveState | null {
  if (draft.conflict !== null) return { kind: 'conflict' };
  if (draft.offline) return { kind: 'offline' };
  if (draft.unsaved > 0) return { kind: 'unsaved', count: draft.unsaved };
  if (draft.saving) return { kind: 'saving' };
  return draft.lastSaved === null ? null : { kind: 'saved' };
}

/** The step in view: the one asked for, or — where Quick mode hides it — the first presented. */
export function stepInView(asked: ProposalStep | null, quick: boolean): ProposalStep {
  const presented = presentedSteps(quick);
  const first = presented[0] ?? 'company';
  if (asked === null) return first;
  return presented.includes(asked) ? asked : first;
}

export interface FrameInput {
  readonly detail: ProposalDetail;
  readonly fields: ProposalFieldSetWire;
  readonly draft: ProposalDraft;
  /** How many things stop Generate, by the server's own count. */
  readonly blocks: number;
  readonly formats: FormatPack;
  readonly asked: ProposalStep | null;
  readonly taxName: string;
}

export function builderFrameOf(input: FrameInput): BuilderFrame {
  const { detail, draft, formats } = input;
  const quick = draft.quickMode ?? detail.quickMode;
  const standingOf = (step: ProposalStep): StepStanding =>
    detail.steps.find((one) => one.step === step)?.standing ?? 'to_do';
  const fact = (step: ProposalStep): BuilderStepFact => ({
    step,
    standing: standingOf(step),
    quiet: quick && !QUICK_STEPS.includes(step),
  });
  const current = stepInView(input.asked, quick);
  const page = STEP_PAGE[current];
  const { document } = detail;
  const at = document.pages.indexOf(page);
  const payable = document.money?.payable.amount ?? null;
  /* The document never prints a refused value: those stay in the fields, as typed. */
  const printable = draft.printable ?? input.fields;
  return {
    allSteps: PROPOSAL_STEPS.map(fact),
    steps: presentedSteps(quick).map(fact),
    current,
    quick,
    save: saveOf(draft),
    payableText:
      payable === null
        ? null
        : formatMinorUnitsPlainly(formats, minorUnitsOfDecimal(payable, formats.minorUnitDigits)),
    recomputing: draft.saving,
    toFix: input.blocks,
    customerName: document.deal.clientName ?? '',
    segment: document.deal.segment,
    city: detail.lead.city,
    page,
    pages: document.pages,
    pageAt: at < 0 ? null : at,
    snapshot: proposalSnapshotOf({ ...document, fields: printable }, formats),
    valueSet: proposalValueSetOf({ ...document, fields: printable }, formats),
    fieldSet: fieldSetOfDocument(printable, formats.minorUnitDigits),
    taxName: input.taxName,
  };
}
