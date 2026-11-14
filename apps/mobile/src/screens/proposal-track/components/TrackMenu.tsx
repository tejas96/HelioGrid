import type { ProposalDetail } from '@heliogrid/contracts';
import type { ProposalTrackScreen } from '@heliogrid/data/react';
import {
  proposalActFailureWords,
  proposalPageHeadWords,
  proposalWithdrawWords,
} from '@heliogrid/i18n';
import { type FocusAfter, Menu, ProposalWithdrawSheet } from '@heliogrid/ui';
import { useProposalFormats } from '../../shared/use-proposal-formats';

/**
 * The track screen's ⋯ in its bar (`M06-58`, `T-M06-031`): withdrawing the proposal, for who may
 * share it, while it is live and its deal is not won. The sheet says what the customer's link will
 * then show; nothing is deleted.
 */
export function TrackMenu({
  detail,
  withdraw,
  focusAfter,
}: {
  detail: ProposalDetail;
  withdraw: ProposalTrackScreen['withdraw'];
  /** The page: the menu leaves with a withdrawn proposal. */
  focusAfter: FocusAfter;
}) {
  const { t, formats } = useProposalFormats();
  const { document } = detail;
  const withdrawable =
    detail.rights.share &&
    document.number !== null &&
    detail.status !== 'withdrawn' &&
    detail.project === null;
  if (!withdrawable) return null;
  const head = proposalPageHeadWords(t, formats);
  const maker = document.preparedBy;
  const sheet = proposalWithdrawWords(t, formats, {
    id: detail.id,
    number: document.number,
    version: detail.versions[0]?.version ?? null,
    standing: detail.standing,
    progress: detail.progress,
    capacityKw: document.fields.system.capacityKw,
    payable: detail.versions[0]?.payable ?? document.money?.payable.amount ?? null,
    madeBy: maker.userId === null ? null : { userId: maker.userId, name: maker.name },
    madeAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    live: true,
  });
  return (
    <>
      <Menu
        label={head.more}
        triggerLook="surface"
        align="end"
        items={[
          { key: 'withdraw', label: head.withdraw, destructive: true, onSelect: withdraw.ask },
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
