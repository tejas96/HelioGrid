'use client';
import { useProposalVersionsScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  proposalActFailureWords,
  proposalPageHeadWords,
  proposalScreenSaid,
  proposalVersionsWords,
  putInForceWords,
} from '@heliogrid/i18n';
import { ProposalVersions, PutInForceSheet, useOwnWidth } from '@heliogrid/ui';
import { OneToast } from '../../../lib/one-toast';
import { PROPOSAL_WIDE_FROM } from '../shared/constants';
import { ProposalPageHead } from '../shared/ProposalPageHead';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';

import '../shared/proposals.css';

/**
 * A proposal's versions on the web (`SCR-M06-16`, `M06-42`): the rep or the owner came to see what
 * moved between versions and why, and — after Won — to put a newer accepted version in force. What
 * is read and sent is `useProposalVersionsScreen`'s, the phone's too; the web's part is the router.
 */
export function ProposalVersionsScreen({ proposalId }: { proposalId: string }) {
  const { t, formats } = useProposalFormats();
  const moves = useProposalMoves();
  const screen = useProposalVersionsScreen(proposalId, {
    toDocument: moves.toDocument,
    toShare: moves.toShare,
  });
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROPOSAL_WIDE_FROM;
  const head = proposalPageHeadWords(t, formats);
  const detail = screen.proposal.kind === 'ready' ? screen.proposal.value : null;
  const name = head.name(detail?.document.number ?? null);
  const customer = detail?.document.deal.clientName ?? null;
  const { inForce } = screen;
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
        here={head.versions}
        label={head.trail}
        title={head.versions}
        summary={head.versionsSummary({
          number: detail?.document.number ?? null,
          customerName: customer,
        })}
      />
      <ProposalVersions
        read={screen.read}
        words={proposalVersionsWords(t, formats)}
        won={screen.won}
        mayShare={screen.mayShare}
        mayPutInForce={screen.mayPutInForce}
        onShare={screen.share}
        onView={screen.view}
        onPutInForce={inForce.open}
        focusAfter={room}
      />
      {inForce.version === null || inForce.preview === null ? null : (
        <PutInForceSheet
          open
          onClose={inForce.close}
          words={putInForceWords(t, formats, {
            version: inForce.version,
            customerName: customer,
            segment: detail?.document.deal.segment ?? null,
          })}
          preview={inForce.preview}
          sending={inForce.sending}
          failure={proposalActFailureWords(t, inForce.failure)}
          onConfirm={inForce.confirm}
        />
      )}
      <OneToast
        fact={inForce.done === null ? null : { version: inForce.done }}
        line={(done) => ({ tone: 'success', title: proposalScreenSaid(t).inForce(done.version) })}
        onDismiss={inForce.dismissDone}
        focusAfter={room}
      />
    </div>
  );
}
