'use client';
import { useMemo, useSyncExternalStore } from 'react';
import type { DraftFieldState } from './proposal-draft-queue';
import { useProposalDraftQueue } from './proposal-draft-store';
import { fieldStateOf } from './proposal-draft-working';

/** The keys the generation fill and the two step resets are told under in the draft's queue. */
export const PROPOSAL_ACT_KEYS = {
  energy: 'act:energy',
  resetTimeline: 'act:reset:timeline',
  resetPayment: 'act:reset:payment',
} as const;

/**
 * Step 4's fill and the two step resets (`M06-10`, `M06-12`, `M06-13`, `T-M06-033`), sent through
 * the draft's own queue so they move the same revision the fields do: a fill pressed while a field
 * is still saving goes after it. Each answers the proposal with the server's values in place.
 */
export interface ProposalEnergy {
  /** Fills the generation from the source of record, or the built-in estimate when it does not answer. */
  fill(): void;
  /** Puts the filled values back after an edit — *Reset to AI values*. */
  reset(): void;
  /** The fill or reset as it stands: saving, saved, kept unsaved, or refused. */
  readonly state: DraftFieldState | null;
  /** Puts the timeline or the payment plan back to the company's template in force. */
  resetStep(step: 'timeline' | 'payment'): void;
  stepState(step: 'timeline' | 'payment'): DraftFieldState | null;
}

export function useProposalEnergy(proposalId: string): ProposalEnergy {
  const queue = useProposalDraftQueue(proposalId);
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);
  return useMemo(() => {
    const keyOf = (step: 'timeline' | 'payment') =>
      step === 'timeline' ? PROPOSAL_ACT_KEYS.resetTimeline : PROPOSAL_ACT_KEYS.resetPayment;
    return {
      fill: () => queue.commit(PROPOSAL_ACT_KEYS.energy, { kind: 'energy', mode: 'fill' }),
      reset: () => queue.commit(PROPOSAL_ACT_KEYS.energy, { kind: 'energy', mode: 'reset' }),
      state: fieldStateOf(snapshot, PROPOSAL_ACT_KEYS.energy),
      resetStep: (step) => queue.commit(keyOf(step), { kind: 'reset', step }),
      stepState: (step) => fieldStateOf(snapshot, keyOf(step)),
    };
  }, [queue, snapshot]);
}
