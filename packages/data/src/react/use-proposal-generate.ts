'use client';
import type { EntitlementBlocked, GenerateVerdictWire } from '@heliogrid/contracts';
import { PROPOSAL_STEPS, type ProposalStep } from '@heliogrid/domain';
import { useRef, useState } from 'react';
import { ProposalNotReadyError } from '../proposals/proposal-refusals';
import { useAction } from './action';
import { useDataLayer } from './context';
import { type ProposalActFailure, proposalActFailureOf, useProposalCache } from './proposal-cache';
import type { DraftSnapshot } from './proposal-draft-queue';
import { useProposalDraftQueue } from './proposal-draft-store';
import { useProposal } from './use-proposal';

/** What the Check sheet sends with Generate. */
export interface GenerateAsk {
  /** What changed and why — asked from the second version on (`M06-42`); `null` on the first. */
  readonly changeNote: string | null;
  /** The person read the below-cost warning and goes on (`M06-37`). */
  readonly belowCostConfirmed: boolean;
}

/** The version a Generate made. */
export interface GeneratedVersion {
  readonly number: string;
  readonly version: number;
}

/** Why Generate did not make a version, as the Check sheet says it. */
export type GenerateFailure =
  /** The server's checklist stopped it: every block, as one list to tap through (`M06-23`). */
  | { readonly kind: 'not_ready'; readonly verdict: GenerateVerdictWire }
  /** A typed value is still not saved, or the draft is in conflict: nothing was sent. */
  | { readonly kind: 'unsaved' }
  /**
   * The server refused a typed value, which is kept on screen at its field: nothing was sent. The
   * step its field sits on (`null` for an act no step owns) and why, so the sheet names it.
   */
  | {
      readonly kind: 'refused_field';
      readonly step: ProposalStep | null;
      readonly failure: ProposalActFailure;
    }
  /**
   * The billing gate refused it (`T-M06-028`): this cycle's proposals are used (`reason: 'cap'`,
   * with when the cycle starts again), or the company's billing state pauses Generate. The draft
   * stays saved. `blocked` is the gate's own facts; `null` only if the refusal carried none.
   */
  | { readonly kind: 'billing'; readonly blocked: EntitlementBlocked | null }
  | Exclude<ProposalActFailure, { readonly kind: 'billing' }>;

/**
 * Generate (`M06-23`, `T-M06-022`): the one checklist, then a frozen version and — on the first —
 * the proposal's number. It waits for every field still saving, so it never runs on a revision a
 * commit is about to move. One submission keeps its moment and its retry key, so a second tap
 * after a dropped answer finds the version the first made (`M06-44`).
 */
export interface ProposalGenerate {
  /** The checklist as the server last worked it out, from the proposal's own read; `null` before it. */
  readonly verdict: GenerateVerdictWire | null;
  generate(ask: GenerateAsk): void;
  readonly generating: boolean;
  /** The version this sheet made, once it landed. */
  readonly generated: GeneratedVersion | null;
  readonly failure: GenerateFailure | null;
  /** Clears the last failure and the made version — the sheet closed, or the person went to fix a block. */
  clear(): void;
}

const UNSAVED = { kind: 'unsaved' } as const;

export function useProposalGenerate(proposalId: string): ProposalGenerate {
  const { repositories, blocked } = useDataLayer();
  const cache = useProposalCache();
  const queue = useProposalDraftQueue(proposalId);
  const read = useProposal(proposalId);
  const [generated, setGenerated] = useState<GeneratedVersion | null>(null);
  const [failure, setFailure] = useState<GenerateFailure | null>(null);
  /* One submission keeps its moment: the same ask on the same revision is the same body, so its
     retry key holds and the server answers the version the first send made. */
  const held = useRef<{ readonly sent: string; readonly capturedAt: string } | null>(null);

  const send = useAction(
    async (ask: GenerateAsk) => {
      if (!(await queue.settled())) return refusedFieldOf(queue.getSnapshot()) ?? UNSAVED;
      const on = cache.held(proposalId);
      if (on === undefined) return UNSAVED;
      const sent = JSON.stringify({ ...ask, revision: on.revision });
      if (held.current?.sent !== sent) {
        held.current = { sent, capturedAt: new Date().toISOString() };
      }
      return repositories.proposals.generate(proposalId, {
        ...ask,
        revision: on.revision,
        capturedAt: held.current.capturedAt,
      });
    },
    {
      onDone: (made) => {
        if (!('proposal' in made)) return setFailure(made);
        held.current = null;
        setGenerated({ number: made.number, version: made.version });
        cache.landed(made.proposal);
      },
      onFailed: (error) => {
        const failed = generateFailureOf(error, blocked.getSnapshot()?.blocked ?? null);
        /* The builder draws a billing refusal as its own gate (`T-M06-028`), so the app's one
           denial stays shut: one message for one act. */
        if (failed.kind === 'billing') blocked.dismiss();
        setFailure(failed);
      },
    },
  );

  return {
    verdict: read.kind === 'ready' ? read.value.checklist : null,
    generate: (ask) => {
      setFailure(null);
      void send.run(ask);
    },
    generating: send.pending,
    generated,
    failure,
    clear: () => {
      held.current = null;
      setFailure(null);
      setGenerated(null);
      send.clear();
    },
  };
}

/** The first value the server refused, with the step its key names (`system.price` → `system`). */
function refusedFieldOf(
  snapshot: DraftSnapshot,
): Extract<GenerateFailure, { readonly kind: 'refused_field' }> | null {
  const entry = snapshot.entries.find((one) => one.status === 'refused' && one.failure !== null);
  if (entry?.failure == null) return null;
  const area = entry.key.split('.')[0];
  const step = PROPOSAL_STEPS.find((one) => one === area) ?? null;
  return { kind: 'refused_field', step, failure: entry.failure };
}

function generateFailureOf(error: unknown, blocked: EntitlementBlocked | null): GenerateFailure {
  if (error instanceof ProposalNotReadyError) return { kind: 'not_ready', verdict: error.verdict };
  const failure = proposalActFailureOf(error);
  return failure.kind === 'billing' ? { kind: 'billing', blocked } : failure;
}
