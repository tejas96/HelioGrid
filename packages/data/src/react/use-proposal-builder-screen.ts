'use client';
import type { ProposalDetail, ProposalFieldSetWire, UiLanguage } from '@heliogrid/contracts';
import {
  type FormatPack,
  formatDate,
  incentiveOfferedTo,
  mapRead,
  PROPOSAL_STEPS,
  type ProposalStep,
  QUICK_STEPS,
  type Read,
} from '@heliogrid/domain';
import { useState } from 'react';
import { type ProposalPageFactsRead, proposalPageFactsOf } from '../proposals/document-snapshot';
import type { StepContext } from './proposal-builder-context';
import { type BuilderFrame, builderFrameOf } from './proposal-builder-frame';
import { builderHoldsChange } from './proposal-builder-leave';
import type { BuilderStepModel } from './proposal-builder-model';
import {
  type PaymentPartEditing,
  type PhaseEditing,
  paymentPartOf,
  phaseEditingOf,
} from './proposal-builder-sheets';
import { stepModelOf } from './proposal-builder-steps';
import type { MovedTo } from './proposal-cache';
import type { PartLabels } from './proposal-part-offers';
import { useBuilderBank } from './use-builder-bank';
import { type BuilderCheck, type BuilderReady, useBuilderCheck } from './use-builder-check';
import { incentiveSchemeOf, useBuilderMarket, useFirstFill, useFlips } from './use-builder-helpers';
import { type LeaveAsk, useLeaveAsk } from './use-leave-ask';
import { type ProposalDraft, useProposalDraft } from './use-proposal-draft';
import { useProposalEnergy } from './use-proposal-energy';
import { type ProposalParts, useProposalParts } from './use-proposal-parts';
import { type ProposalPlanLimit, useProposalPlanLimit } from './use-proposal-plan-limit';
import { useTermsDefault } from './use-terms-default';

type Wire = ProposalFieldSetWire;

/** Where the builder leads: the app's own router performs each (Law 11). */
export interface BuilderIntents {
  /** Another step, by its key — the route's `?step=`, so Back and forward walk the steps. */
  readonly toStep: (step: ProposalStep) => void;
  /** Close: the draft is kept and the lead it hangs on opens. */
  readonly toLead: (leadId: string) => void;
  /** *See it and share*: the proposal's own screen. */
  readonly toProposal: (proposalId: string) => void;
}

export interface BuilderScreenOptions {
  /** The step the route asks for; `null` opens the first one presented. */
  readonly step: ProposalStep | null;
  readonly formats: FormatPack;
  /** The reader's language, for the platform's words where the company saved none. */
  readonly reader: UiLanguage;
  readonly intents: BuilderIntents;
  /** Words a stored value needs that only the caller can write in the reader's language. */
  readonly labels: PartLabels & { readonly newPart: (number: number) => string };
}

/**
 * The proposal builder (`SCR-M06-02`…`SCR-M06-13`) as both screens draw it, assembled once (Law
 * 11): the frame, the step in view, the sheets it opens, the check and the screen after Generate.
 * Navigation never waits on a step (`M06-22`); every field commits when it is left (`M06-25`).
 */
export interface ProposalBuilderScreen {
  readonly read: Read<{ readonly frame: BuilderFrame; readonly step: BuilderStepModel }>;
  readonly detail: ProposalDetail | null;
  /** The document's own facts beside its value set — number, date, pictures; `null` until read. */
  readonly pageFacts: ProposalPageFactsRead | null;
  /** The lead moved to another person while the draft was open (`T-M06-023`). */
  readonly moved: { readonly to: MovedTo | null; reload(): void } | null;
  readonly stepsOpen: boolean;
  openSteps(): void;
  closeSteps(): void;
  readonly previewOpen: boolean;
  openPreview(): void;
  closePreview(): void;
  goStep(step: ProposalStep): void;
  /** The same, by the key a frame or a list answers with; a key that names no step does nothing. */
  goStepByKey(key: string): void;
  /** The Quick switch (`M06-18`, `M06-19`): loss-free either way. */
  toggleQuick(): void;
  close(): void;
  /** `held` while the screen shows what the server does not (`builderHoldsChange`): a way out asks. */
  readonly leave: LeaveAsk & { readonly held: boolean };
  openCheck(): void;
  readonly check: BuilderCheck;
  /** The plan's count, read only while the check stands at the plan's limit (`T-M06-028`). */
  readonly plan: ProposalPlanLimit | null;
  readonly parts: ProposalParts;
  readonly phase: PhaseEditing | null;
  readonly paymentPart: PaymentPartEditing | null;
  /** `null` until this screen's Generate made a version. */
  readonly ready: BuilderReady | null;
}

/** What every step's model is built over: the draft as it stands and the ways a step changes it. */
function contextOf(
  detail: ProposalDetail,
  fields: Wire,
  draft: ProposalDraft,
  rest: Pick<StepContext, 'formats' | 'batteryTaxPercent' | 'flipped' | 'acts'>,
): StepContext {
  return {
    detail,
    fields,
    deal: { ...detail.document.deal, ...draft.deal },
    commit: draft.commit,
    hold: draft.hold,
    stateOf: draft.stateOf,
    retry: draft.retry,
    reload: draft.reload,
    ...rest,
  };
}

export function useProposalBuilderScreen(
  proposalId: string,
  options: BuilderScreenOptions,
): ProposalBuilderScreen {
  const { formats, intents, labels } = options;
  const draft = useProposalDraft(proposalId);
  const energy = useProposalEnergy(proposalId);
  const market = useBuilderMarket();
  const flips = useFlips();
  const [stepsOpen, setStepsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [phaseAt, setPhaseAt] = useState<number | 'new' | null>(null);
  const [partAt, setPartAt] = useState<number | 'new' | null>(null);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount' | null>(null);
  const [termsTyped, setTermsTyped] = useState<Wire['terms'] | null>(null);

  const detail = draft.read.kind === 'ready' ? draft.read.value : null;
  const fields = draft.fields;
  const quick = draft.quickMode ?? detail?.quickMode ?? false;
  const leadId = detail?.lead.id ?? null;

  const goStep = (step: ProposalStep) => {
    setStepsOpen(false);
    /* A step Quick mode hides opens in the full rail: the mode goes, the values stay (`M06-19`). */
    if (quick && !QUICK_STEPS.includes(step)) {
      flips.set('quick', false);
      draft.commit('quick', { quickMode: false });
    }
    intents.toStep(step);
  };
  const toLead = () => {
    if (leadId !== null) intents.toLead(leadId);
  };
  const checked = useBuilderCheck(proposalId, {
    saving: draft.saving,
    /* From version 2 on a version says what changed and why (`M06-42`). */
    asksChangeNote: (detail?.versions.length ?? 0) > 0,
    formats,
    goStep,
    toProposal: () => intents.toProposal(proposalId),
    toLead,
  });

  const termsDefault = useTermsDefault(options.reader);
  const bank = useBuilderBank(proposalId, detail?.rights.writesCompanyFacts === true);
  const parts = useProposalParts({
    fields,
    commit: (change) =>
      draft.commit('components.rows', {
        fields: (stored) => ({ components: change(stored.components, stored) }),
      }),
    labels,
  });

  const ctx =
    detail === null || fields === null
      ? null
      : contextOf(detail, fields, draft, {
          formats,
          batteryTaxPercent: market.batteryTaxPercent,
          flipped: flips.flipped,
          acts: {
            pickCategory: (category) => {
              intents.toStep('components');
              parts.open(category);
            },
            editPhase: setPhaseAt,
            addPhase: () => setPhaseAt('new'),
            editPart: setPartAt,
            addPart: () => setPartAt('new'),
            incentiveOffered: incentiveOfferedTo(
              market.subsidy,
              detail.document.deal.segment,
              fields.system.systemType,
            ),
            incentiveScheme: incentiveSchemeOf(market.subsidy),
            checkAsked: checked.asked,
            resetStep: energy.resetStep,
            refill: fields.performance.editedMonthlyKwh === null ? energy.fill : energy.reset,
            energyState: energy.state,
            discountMode,
            chooseDiscountMode: setDiscountMode,
            termsTyped,
            typeTerms: setTermsTyped,
            termsDefault: detail.rights.writesCompanyFacts ? termsDefault : null,
            bank,
          },
        });
  const frame =
    ctx === null
      ? null
      : builderFrameOf({
          detail: ctx.detail,
          fields: ctx.fields,
          draft,
          blocks: checked.blocks,
          taxName: market.taxName,
          formats,
          asked: options.step,
        });

  useFirstFill(fillsNow(frame, ctx, energy.state), energy.fill);
  const leave = useLeaveAsk(draft.reload);
  const plan = useProposalPlanLimit(
    checked.check.open && checked.check.failure?.kind === 'billing',
  );

  return {
    read:
      frame === null || ctx === null
        ? mapRead(draft.read, () => {
            throw new Error('a draft that is read has its frame');
          })
        : { kind: 'ready', value: { frame, step: stepModelOf(frame.current, ctx) } },
    detail,
    pageFacts: pageFactsOf(detail, formats, options.reader),
    moved:
      draft.conflict?.kind === 'lead_moved'
        ? { to: draft.conflict.to, reload: draft.reload }
        : null,
    stepsOpen,
    openSteps: () => setStepsOpen(true),
    closeSteps: () => setStepsOpen(false),
    previewOpen,
    openPreview: () => setPreviewOpen(true),
    closePreview: () => setPreviewOpen(false),
    goStep,
    goStepByKey: (key) => {
      const step = PROPOSAL_STEPS.find((one) => one === key);
      if (step !== undefined) goStep(step);
    },
    toggleQuick: () => draft.commit('quick', { quickMode: flips.flipped('quick', quick) }),
    close: toLead,
    leave: { ...leave, held: builderHoldsChange(frame, draft.refused) },
    openCheck: () => {
      setStepsOpen(false);
      checked.openCheck();
    },
    check: checked.check,
    plan,
    parts,
    phase: phaseEditingOf(ctx, phaseAt, () => setPhaseAt(null)),
    paymentPart: paymentPartOf(
      ctx,
      partAt,
      { formats, subsidy: market.subsidy },
      labels.newPart,
      () => setPartAt(null),
    ),
    ready: checked.ready,
  };
}

/** The document's own facts, its date in the reader's words — as every page prints it. */
function pageFactsOf(
  detail: ProposalDetail | null,
  formats: FormatPack,
  reader: UiLanguage,
): ProposalPageFactsRead | null {
  if (detail === null) return null;
  return proposalPageFactsOf(detail.document, (value) => formatDate(formats, value, reader));
}

/**
 * Step 4 fills itself the first time it opens with a place and a size (`M06-10`) — and Quick mode,
 * which never shows steps 4 and 5, fills them the moment both exist (`M06-18`).
 */
function fillsNow(
  frame: BuilderFrame | null,
  ctx: StepContext | null,
  energyState: StepContext['acts']['energyState'],
): boolean {
  if (frame === null || ctx === null) return false;
  const wanted = frame.current === 'performance' || frame.quick;
  return (
    wanted &&
    ctx.fields.performance.source === null &&
    ctx.deal.area !== null &&
    ctx.fields.system.capacityKw !== null &&
    energyState === null
  );
}
