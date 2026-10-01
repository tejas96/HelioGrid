import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Sheet, UnavailableNote } from '@heliogrid/ui';

/**
 * The grievance contact's place (`F1-59`). The market pack has not authored the contact yet
 * (`T-FCORE-009`), so the note says it is not published and names no person or address.
 */
export function GrievanceNote({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslate();
  return (
    <Sheet open={open} onClose={onClose} title={t(SHELL.grievanceOfficer)} size="auto">
      <UnavailableNote message={t(SHELL.grievanceNotPublished)} />
    </Sheet>
  );
}
