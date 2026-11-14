'use client';
import type { ProposalDetail, TranslatedText } from '@heliogrid/contracts';
import type { ProposalTrackScreen } from '@heliogrid/data/react';
import { proposalActFailureWords, proposalWithdrawWords } from '@heliogrid/i18n';
import { type FocusAfter, Menu, ProposalWithdrawSheet } from '@heliogrid/ui';
import { useProposalFormats } from '../shared/use-proposal-formats';

/**
 * The track page's *More* (`M06-58`, `T-M06-031`): withdrawing the proposal, for who may share it.
 * The sheet says what the customer's link will then show; nothing is deleted.
 */
export function TrackMenu({
  detail,
  withdraw,
  label,
  words,
  focusAfter,
}: {
  detail: ProposalDetail;
  withdraw: ProposalTrackScreen['withdraw'];
  label: TranslatedText;
  words: { readonly withdraw: TranslatedText };
  /** The page: the menu leaves with a withdrawn proposal. */
  focusAfter: FocusAfter;
}) {
  const { t, formats } = useProposalFormats();
  const live = detail.document.number !== null && detail.status !== 'withdrawn';
  if (!detail.rights.share || !live || detail.project !== null) return null;
  const { preparedBy } = detail.document;
  const sheet = proposalWithdrawWords(t, formats, {
    id: detail.id,
    number: detail.document.number,
    version: detail.versions[0]?.version ?? null,
    standing: detail.standing,
    progress: detail.progress,
    capacityKw: detail.document.fields.system.capacityKw,
    payable: detail.versions[0]?.payable ?? detail.document.money?.payable.amount ?? null,
    madeBy:
      preparedBy.userId === null ? null : { userId: preparedBy.userId, name: preparedBy.name },
    madeAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    live: true,
  });
  return (
    <>
      <Menu
        label={label}
        triggerLook="surface"
        align="end"
        items={[
          { key: 'withdraw', label: words.withdraw, destructive: true, onSelect: withdraw.ask },
        ]}
      />
      <ProposalWithdrawSheet
        open={withdraw.asking}
        onClose={withdraw.close}
        close={sheet.close}
        words={sheet.words}
        sending={withdraw.sending}
        failure={proposalActFailureWords(t, withdraw.failure)}
        onConfirm={withdraw.confirm}
        focusAfter={focusAfter}
      />
    </>
  );
}
