import { useProposalListScreen } from '@heliogrid/data/react';
import { useReadAgainOnFocus } from '../shared/use-read-again-on-focus';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';
import { ProposalsListBody } from './components/ProposalsListBody';
import { useProposalsListMoves } from './hooks/use-proposals-list-moves';

/**
 * The proposals list on the phone (`SCR-M06-19`, `M06-48`), the pill's Proposals door: a rep
 * between visits finds one proposal and sees where each stands, or starts one — in one hand, on a
 * slow network, with long names in Hindi or Marathi, so each proposal is its own card. What is
 * read, filtered and started is `useProposalListScreen`'s, the web's too; the phone's own parts are
 * the navigator, the pull that reads the list again and the read again on a return to the screen.
 * A person whose shell offers neither Leads nor Proposals meets not found.
 */
export function ProposalsListScreen() {
  const moves = useProposalsListMoves();
  const screen = useProposalListScreen(moves);
  useReadAgainOnFocus(screen.refreshIfStale);
  return (
    <ShellPage
      inView="proposals"
      {...(screen.allowed ? { pull: { pulled: screen.pulled, onPull: screen.refresh } } : {})}
    >
      {screen.allowed ? (
        <ProposalsListBody screen={screen} onNewVersion={(row) => moves.toBuilder(row.id)} />
      ) : (
        <ShellNotFoundState />
      )}
    </ShellPage>
  );
}
