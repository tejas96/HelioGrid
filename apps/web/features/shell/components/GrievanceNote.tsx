'use client';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Modal, UnavailableNote } from '@heliogrid/ui';

/**
 * The grievance contact's place (`F1-59`). The market pack has not authored the contact yet
 * (`T-FCORE-009`), so the note says it is not published and names no person or address. The
 * phone's is a sheet; the web's is a modal.
 */
export function GrievanceNote({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslate();
  return (
    <Modal open={open} onClose={onClose} title={t(SHELL.grievanceOfficer)} size="sm">
      <UnavailableNote title={t(SHELL.notPublishedYet)} message={t(SHELL.grievanceNotPublished)} />
    </Modal>
  );
}
