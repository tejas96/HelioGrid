'use client';
import { useProposalLinksScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  newLinkWords,
  proposalActFailureWords,
  proposalLinksPageWords,
  proposalLinksWords,
  proposalPageHeadWords,
  proposalScreenSaid,
} from '@heliogrid/i18n';
import {
  Button,
  IconButton,
  NewLinkSheet,
  ProposalLinks,
  ShellGlyph,
  useOwnWidth,
} from '@heliogrid/ui';
import { OneToast } from '../../../lib/one-toast';
import { PROPOSAL_WIDE_FROM } from '../shared/constants';
import { ProposalPageHead } from '../shared/ProposalPageHead';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';

import '../shared/proposals.css';

/**
 * A deal's named links on the web (`SCR-M06-20`, `F5-30`): the rep came to see who opened which
 * link, to give another person their own, or to turn one off — which stops at once, so it asks
 * first. The customer's page shows none of this. What is read and sent is
 * `useProposalLinksScreen`'s, the phone's too; the web's own part is the clipboard.
 */
export function ProposalLinksScreen({ proposalId }: { proposalId: string }) {
  const { t, formats } = useProposalFormats();
  const said = proposalScreenSaid(t);
  const moves = useProposalMoves();
  const screen = useProposalLinksScreen(proposalId, { copy: moves.copy });
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROPOSAL_WIDE_FROM;
  const head = proposalPageHeadWords(t, formats);
  const page = proposalLinksPageWords(t);
  const detail = screen.proposal.kind === 'ready' ? screen.proposal.value : null;
  const name = head.name(detail?.document.number ?? null);
  const { newLink } = screen;
  const plus = <ShellGlyph name="plus" size="sm" />;
  return (
    <div
      ref={room}
      tabIndex={-1}
      className="hg-shell-page hg-focus-target hg-proposal-page"
      data-narrow="true"
    >
      <ProposalPageHead
        wide={wide}
        trail={[
          { label: destinationLabel(t, 'proposals'), onOpen: moves.toList },
          { label: name, onOpen: () => moves.toProposal(proposalId) },
        ]}
        here={head.links}
        label={head.trail}
        title={head.links}
        summary={page.summary}
        acts={
          screen.mayMint ? (
            <Button icon={plus} onClick={newLink.openSheet}>
              {page.newLink}
            </Button>
          ) : undefined
        }
        barActs={
          screen.mayMint ? (
            <IconButton label={page.newLink} variant="dark" onClick={newLink.openSheet}>
              <ShellGlyph name="plus" size="sm" tone="inverse" />
            </IconButton>
          ) : undefined
        }
      />
      <ProposalLinks
        read={screen.read}
        words={proposalLinksWords(t, formats)}
        pending={screen.pending}
        failure={
          screen.failure === null
            ? null
            : {
                linkId: screen.failure.linkId,
                reason: proposalActFailureWords(t, screen.failure.failure) ?? said.notCopied,
              }
        }
        confirming={screen.confirming}
        onCopy={screen.copy}
        onRemint={screen.remint}
        onAskRevoke={screen.askRevoke}
        onRevoke={screen.revoke}
        onCancelRevoke={screen.cancelRevoke}
        focusAfter={room}
      />
      <NewLinkSheet
        open={newLink.open}
        onClose={newLink.close}
        words={newLinkWords(t)}
        contacts={screen.read.kind === 'ready' ? screen.read.value.contacts : []}
        draft={newLink.draft}
        onChange={newLink.change}
        sending={newLink.sending}
        failure={proposalActFailureWords(t, newLink.failure)}
        onMake={newLink.make}
      />
      <OneToast
        fact={screen.said}
        line={(fact) => ({
          tone: fact.act === 'not_copied' ? 'warning' : 'success',
          title: page.said(fact),
        })}
        onDismiss={screen.dismissSaid}
        focusAfter={room}
      />
    </div>
  );
}
