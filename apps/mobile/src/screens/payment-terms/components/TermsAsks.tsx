import type { PaymentTermsWords } from '@heliogrid/i18n';
import { Button, LeaveConfirm, Modal, SheetActions } from '@heliogrid/ui';

/**
 * *Archive {name}?* (`SCR-M01-20` m20-n9): opened from the editor, so it stands above the sheet.
 * The archive itself is the page's act; its success closes the editor.
 */
export function TermsArchiveConfirm({
  name,
  words,
  closeLabel,
  onKeep,
  onArchive,
}: {
  /** The template asked about; `null` while nothing is asked. */
  name: string | null;
  words: PaymentTermsWords;
  closeLabel: string;
  onKeep: () => void;
  onArchive: () => void;
}) {
  return (
    <Modal
      open={name !== null}
      onClose={onKeep}
      closeLabel={closeLabel}
      tone="neutral"
      size="sm"
      density="functional"
      showClose
      title={words.archiveTitle(name ?? '')}
      description={words.archiveBody}
      footer={
        <SheetActions>
          <Button variant="secondary" size="md" onClick={onKeep}>
            {words.keepIt}
          </Button>
          <Button variant="primary" size="md" onClick={onArchive}>
            {words.archive}
          </Button>
        </SheetActions>
      }
    />
  );
}

/** *Leave without saving?* — the editor's ✕, *Cancel*, drag and Back, and the page's way back. */
export function TermsLeaveAsk({
  open,
  words,
  onKeep,
  onLeave,
}: {
  open: boolean;
  words: PaymentTermsWords;
  onKeep: () => void;
  onLeave: () => void;
}) {
  return (
    <LeaveConfirm
      open={open}
      title={words.leaveTitle}
      body={words.leaveBody}
      discard={words.leaveConfirm}
      keep={words.keepEditing}
      onKeep={onKeep}
      onLeave={onLeave}
    />
  );
}
