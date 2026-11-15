'use client';
import type { BuilderIntents } from '@heliogrid/data/react';
import { PROPOSAL_STEPS, type ProposalStep, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGuardedMove } from '../../../lib/leave-guard';
import { openExternal } from '../../../lib/open-external';
import { settingsRowPath } from '../../settings';
import { leadPath, proposalBuilderPath, proposalPath } from '../../shell';

/**
 * The builder's web moves — the platform adapter: the step rides the address (`?step=`), so the
 * browser's Back and forward walk the steps; Close leads to the lead, asking first while a value
 * is not stored; a made PDF opens in a tab.
 */
export function useBuilderMoves(proposalId: string): {
  step: ProposalStep | null;
  intents: BuilderIntents;
  openFile: (url: string) => void;
  /** *See plans*, at the plan's limit (`T-M06-028`). */
  toPlans: () => void;
} {
  const router = useRouter();
  const guarded = useGuardedMove();
  const asked = useSearchParams().get('step');
  return {
    step: PROPOSAL_STEPS.find((step) => step === asked) ?? null,
    intents: {
      toStep: (step) => router.push(proposalBuilderPath(proposalId, step), { scroll: false }),
      toLead: (leadId) => guarded(() => router.push(leadPath(leadId))),
      toProposal: (id) => router.push(proposalPath(id)),
    },
    openFile: (url) => openExternal(url),
    toPlans: () => router.push(settingsRowPath(SETTINGS_SEGMENT.billing)),
  };
}
