'use client';
import type { LeadDetail } from '@heliogrid/contracts';
import type { LeadProposalsSection } from '@heliogrid/data/react';
import {
  leadProposalsWords,
  proposalActFailureWords,
  proposalMoments,
  proposalStartSources,
  proposalStartWords,
  proposalWithdrawWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type FocusAfter,
  type LeadProposalsPanel,
  ProposalStartSheet,
  ProposalWithdrawSheet,
  useFormat,
} from '@heliogrid/ui';

/** What the lead's proposals print the tenant's facts with. */
function useFormats() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const moments = proposalMoments(t, { pack: format.pack, language: locale, now: Date.now() });
  return {
    t,
    formats: {
      money: (amount: string) => format.moneyPlain(amount),
      number: (value: number) => format.number(value),
      ago: moments.ago,
      day: (instant: string) => format.date(instant),
    },
  };
}

/**
 * The Proposals section as `LeadSections` draws it (`T-M06-001`): its five states and their acts.
 * `null` on an api built before proposals, where the section draws its count alone.
 */
export function useLeadProposalsPanel(
  lead: LeadDetail,
  section: LeadProposalsSection,
  onReopenLead: (() => void) | null,
): LeadProposalsPanel | null {
  const { t, formats } = useFormats();
  if (section.section === null) return null;
  const { state } = lead.lead;
  return {
    section: section.section,
    closed: section.closed,
    words: leadProposalsWords(t, formats, {
      customerName: lead.lead.name,
      segment: lead.lead.segment,
      closedAs: state === 'lost' || state === 'disqualified' || state === 'junk' ? state : null,
    }),
    onCreate: section.create,
    onContinue: section.continueDraft,
    onOpen: section.open,
    onWithdraw: section.withdraw.ask,
    onReopenLead,
    onOpenSibling: section.openSibling,
  };
}

/** The sheets the section opens: where a proposal starts, and the withdrawing of one of two. */
export function LeadProposalSheets({
  lead,
  section,
  focusAfter,
}: {
  lead: LeadDetail;
  section: LeadProposalsSection;
  focusAfter: FocusAfter;
}) {
  const { t, formats } = useFormats();
  const { start, withdraw } = section;
  const startWords = proposalStartWords(t, {
    name: lead.lead.name ?? '',
    segment: lead.lead.segment,
  });
  const chosen = section.section?.items.find((item) => item.id === withdraw.proposalId) ?? null;
  const sheet = chosen === null ? null : proposalWithdrawWords(t, formats, chosen);
  return (
    <>
      <ProposalStartSheet
        open={start.open}
        onClose={start.close}
        words={startWords}
        mode={start.mode}
        onMode={start.setMode}
        sources={proposalStartSources(t, formats, start.recent)}
        onCopy={start.copy}
        onStart={start.go}
        starting={start.starting}
        {...failureOf(proposalActFailureWords(t, start.failure))}
      />
      <ProposalWithdrawSheet
        open={sheet !== null}
        onClose={withdraw.close}
        close={startWords.closeLabel}
        words={sheet?.words ?? null}
        sending={withdraw.sending}
        failure={proposalActFailureWords(t, withdraw.failure)}
        onConfirm={withdraw.confirm}
        focusAfter={focusAfter}
      />
    </>
  );
}

/** The start sheet takes its failure only where there is one. */
function failureOf<Words>(failure: Words | null): { failure?: Words } {
  return failure === null ? {} : { failure };
}
