import type { ProposalTrackMoves, ProposalTrackScreen } from '@heliogrid/data/react';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import type { ProposalMoves } from '../../shared/use-proposal-moves';

/**
 * The track screen's moves as its view model asks for them, performed by the phone: the builder,
 * the document, the versions and the links by the navigator; *Confirm won* opens the lead on its
 * Mark won sheet; the chat, the share sheet and the PDF's viewer are the shared adapter's.
 */
export function trackMovesOf(moves: ProposalMoves): ProposalTrackMoves {
  return {
    toBuilder: moves.toBuilder,
    toDocument: (proposalId) => moves.toDocument(proposalId),
    toVersions: moves.toVersions,
    toLinks: moves.toLinks,
    toLead: moves.toLeadWon,
    toProject: moves.toProject,
    callLead: moves.callLead,
    dial: moves.dial,
    openChat: moves.openChat,
    copy: moves.copy,
    openFile: moves.openFile,
    toTaxNumber: moves.toTaxNumber,
  };
}

/**
 * `?share=1` in the route opens the share sheet once the proposal is read by someone who may share
 * it; the mark is then taken off the route, so the next *Share* handed to this screen — already in
 * the stack — opens it again.
 */
export function useShareOnArrival(share: string | undefined, screen: ProposalTrackScreen): void {
  const navigation = useNavigation();
  const ready = screen.read.kind === 'ready' && screen.read.value.rights.share;
  useEffect(() => {
    if (share === undefined || !ready) return;
    screen.open('share');
    navigation.setParams({ share: undefined });
  }, [share, ready, screen, navigation]);
}
