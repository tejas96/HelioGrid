import type { LeadDetail } from '@heliogrid/contracts';
import type { LeadProposalsSection } from '@heliogrid/data/react';
import {
  leadProposalsWords,
  proposalActFailureWords,
  proposalStartSheetSaid,
  proposalWithdrawWords,
} from '@heliogrid/i18n';
import {
  type FocusAfter,
  type LeadProposalsPanel,
  ProposalStartSheet,
  ProposalWithdrawSheet,
  proposalStartSheetPropsOf,
} from '@heliogrid/ui';
import { useProposalFormats } from '../../shared/use-proposal-formats';

/**
 * The Proposals section as `LeadSections` draws it on the phone (`T-M06-001`): none, a draft, one
 * proposal, two with the warning, or a closed lead — and what each act does. `null` on an api built
 * before proposals, where the section draws its count alone.
 */
export function useLeadProposalsPanel(
  lead: LeadDetail,
  proposals: LeadProposalsSection,
  onReopenLead: (() => void) | null,
): LeadProposalsPanel | null {
  const { t, formats } = useProposalFormats();
  const { section } = proposals;
  if (section === null) return null;
  /* A closed lead names how it closed in its own last close; an open one names nothing. */
  const closedAs = proposals.closed ? (lead.lifecycle.lastClose?.state ?? null) : null;
  return {
    section,
    closed: proposals.closed,
    words: leadProposalsWords(t, formats, {
      customerName: lead.lead.name,
      segment: lead.lead.segment,
      closedAs,
    }),
    onCreate: proposals.create,
    onContinue: proposals.continueDraft,
    onOpen: proposals.open,
    onWithdraw: proposals.withdraw.ask,
    onReopenLead,
    onOpenSibling: proposals.openSibling,
  };
}

/**
 * The sheets the section opens: where a proposal starts — Quick or Full, or the same as a recent
 * one — and the withdrawing of one of two. Both rise over the lead and lift over the keyboard.
 */
export function LeadProposalSheets({
  lead,
  proposals,
  focusAfter,
}: {
  lead: LeadDetail;
  proposals: LeadProposalsSection;
  /** The page: where focus lands once a withdraw takes its row's act away. */
  focusAfter: FocusAfter;
}) {
  const { t, formats } = useProposalFormats();
  const { start, withdraw, section } = proposals;
  const said = proposalStartSheetSaid(t, formats, {
    name: lead.lead.name ?? '',
    segment: lead.lead.segment,
    ...start,
  });
  const asked = section?.items.find((item) => item.id === withdraw.proposalId);
  const sheet = asked === undefined ? null : proposalWithdrawWords(t, formats, asked);
  return (
    <>
      <ProposalStartSheet {...proposalStartSheetPropsOf(start, said)} />
      <ProposalWithdrawSheet
        open={sheet !== null}
        onClose={withdraw.close}
        close={said.words.closeLabel}
        words={sheet?.words ?? null}
        sending={withdraw.sending}
        failure={proposalActFailureWords(t, withdraw.failure)}
        onConfirm={withdraw.confirm}
        focusAfter={focusAfter}
      />
    </>
  );
}
