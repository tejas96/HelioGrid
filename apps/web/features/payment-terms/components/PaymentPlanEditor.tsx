'use client';
import type { PaymentTermsScreen } from '@heliogrid/data/react';
import { LeaveConfirm } from '@heliogrid/ui';
import { useTermsEditor } from '../hooks/use-terms-editor';
import { TermsArchiveConfirm } from './TermsArchiveConfirm';
import { TermsEditorSheet } from './TermsEditorSheet';

/**
 * The payment-terms editor opened from another page (`T-M01-030`: Proposal defaults' *New plan* and
 * *Change this plan*): the same sheet, stage picker and asks Payment terms draws (`SCR-M01-20`),
 * over the same `usePaymentTermsScreen` — never a second editor.
 */
export function PaymentPlanEditor({ screen }: { screen: PaymentTermsScreen }) {
  const { view, words, closeLabel } = useTermsEditor(screen);
  return (
    <>
      <TermsEditorSheet
        view={view}
        words={words}
        closeLabel={closeLabel}
        onClose={screen.closeEditor}
        onDonePicking={screen.donePicking}
      />
      <TermsArchiveConfirm
        name={screen.archiveAsked ? (view?.title ?? '') : null}
        words={words}
        closeLabel={closeLabel}
        onKeep={screen.keepTemplate}
        onArchive={screen.archive}
      />
      <LeaveConfirm
        open={screen.leaveAsked}
        title={words.leaveTitle}
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onKeep={screen.keepEditing}
        onLeave={screen.discardAndLeave}
      />
    </>
  );
}
