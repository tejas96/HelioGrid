import type { ProposalListMoves } from '@heliogrid/data/react';
import { useNavigation } from '@react-navigation/native';
import { useProposalMoves } from '../../shared/use-proposal-moves';

/**
 * Where the Proposals page goes on the phone: one proposal's page, the builder for a draft, a
 * design's own page, or the Site details of a design just made — whose Cancel comes back here.
 */
export function useProposalsListMoves(): ProposalListMoves {
  const navigation = useNavigation();
  const { toProposal, toBuilder } = useProposalMoves();
  return {
    toProposal,
    toBuilder,
    toDesign: (designId) => navigation.navigate('Design', { designId }),
    toSiteDetails: (designId) => navigation.navigate('SiteDetails', { designId }),
  };
}
