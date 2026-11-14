import { useProposalMoves } from '../../shared/use-proposal-moves';

/** Where the proposals list goes on the phone: one proposal's page, or the builder for a draft. */
export function useProposalsListMoves() {
  const { toProposal, toBuilder } = useProposalMoves();
  return { toProposal, toBuilder };
}
