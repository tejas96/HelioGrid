import type { ProposalFieldSetWire } from '@heliogrid/contracts';
import {
  type FormatPack,
  type ProjectChainStage,
  type SubsidyPack,
  trancheDueStages,
} from '@heliogrid/domain';
import { editStep, percentWire, type StepContext } from './proposal-builder-context';

/**
 * The two small sheets a builder step opens on one row of its own list (`T-M06-008`,
 * `T-M06-009`): a timeline step, and a payment part. Each edits the row whole and closes.
 */

type Phase = ProposalFieldSetWire['timeline'][number];

/** The phase the one sheet edits (`T-M06-008`): an existing step of the timeline, or a new one. */
export interface PhaseEditing {
  /** One-based, as the sheet's title counts it. */
  readonly number: number;
  readonly phase: Phase;
  done(phase: Phase): void;
  close(): void;
}

/** One payment part as its sheet edits it (`M06-13`, `T-M06-009`): its name and its due stage. */
export interface PaymentPartDraft {
  readonly label: string;
  readonly dueOnStage: ProjectChainStage;
}

/** The part the one sheet edits: a part of the plan, or a new one. */
export interface PaymentPartEditing {
  /** One-based, as the sheet's title counts it. */
  readonly number: number;
  readonly isNew: boolean;
  readonly part: PaymentPartDraft;
  /** Only the stages this segment's projects visit — the pack's own rule. */
  readonly stages: readonly ProjectChainStage[];
  done(part: PaymentPartDraft): void;
  close(): void;
}

const EMPTY_PHASE: Phase = { name: '', description: '', durationDays: null };

export function phaseEditingOf(
  ctx: StepContext | null,
  at: number | 'new' | null,
  close: () => void,
): PhaseEditing | null {
  if (ctx === null || at === null) return null;
  const phases = ctx.fields.timeline;
  const index = at === 'new' ? phases.length : at;
  return {
    number: index + 1,
    phase: phases[index] ?? EMPTY_PHASE,
    done: (next) => {
      editStep(ctx, 'timeline.rows', 'timeline', (stored) =>
        index >= stored.length
          ? [...stored, next]
          : stored.map((one, position) => (position === index ? next : one)),
      );
      close();
    },
    close,
  };
}

const WHOLE = 100;

export function paymentPartOf(
  ctx: StepContext | null,
  at: number | 'new' | null,
  market: { readonly formats: FormatPack; readonly subsidy: SubsidyPack | null },
  newLabel: (number: number) => string,
  close: () => void,
): PaymentPartEditing | null {
  if (ctx === null || at === null) return null;
  const stages = trancheDueStages(market.formats, market.subsidy, ctx.deal.segment);
  const { tranches } = ctx.fields.payment;
  const index = at === 'new' ? tranches.length : at;
  const stored = tranches[index];
  /* A new part falls due where the last one does, until the person picks its own stage. */
  const fallback = tranches.at(-1)?.dueOnStage ?? stages[0];
  if (fallback === undefined) return null;
  /* The stage a row already holds stays offered, even where this segment would not be offered it new. */
  const held = stored?.dueOnStage ?? fallback;
  return {
    number: index + 1,
    isNew: stored === undefined,
    part: { label: stored?.label ?? newLabel(index + 1), dueOnStage: held },
    stages: stages.includes(held) ? stages : [...stages, held],
    done: (part) => {
      editStep(ctx, 'payment.rows', 'payment', (payment) => {
        const allocated = payment.tranches.reduce((sum, one) => sum + Number(one.percent), 0);
        const rows =
          index >= payment.tranches.length
            ? [
                ...payment.tranches,
                { ...part, percent: percentWire(Math.max(0, WHOLE - allocated)) },
              ]
            : payment.tranches.map((one, position) =>
                position === index ? { ...one, ...part } : one,
              );
        /* A row changed by hand no longer follows a plan: the rows are this proposal's alone. */
        return { templateId: null, tranches: rows };
      });
      close();
    },
    close,
  };
}
