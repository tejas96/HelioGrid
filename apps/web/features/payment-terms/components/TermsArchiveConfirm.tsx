import type { PaymentTermsWords } from '@heliogrid/i18n';
import { Button, Modal, SheetActions } from '@heliogrid/ui';

/**
 * *Archive {name}?* (`SCR-M01-20` m20-n9): asks before the template leaves new proposals. Keeping
 * it is the safe answer, so ✕ keeps it too; nothing is deleted either way.
 */
export function TermsArchiveConfirm({
  name,
  words,
  closeLabel,
  onArchive,
  onKeep,
}: {
  /** The template asked about; `null` while nothing is asked. */
  name: string | null;
  words: Pick<PaymentTermsWords, 'archiveTitle' | 'archiveBody' | 'keepIt' | 'archive'>;
  closeLabel: string;
  onArchive: () => void;
  onKeep: () => void;
}) {
  return (
    <Modal
      open={name !== null}
      onClose={onKeep}
      closeLabel={closeLabel}
      tone="neutral"
      size="sm"
      density="functional"
      title={words.archiveTitle(name ?? '')}
      description={words.archiveBody}
      showClose
      footer={
        <SheetActions>
          <Button variant="secondary" size="lg" onClick={onKeep}>
            {words.keepIt}
          </Button>
          <Button variant="primary" size="lg" onClick={onArchive}>
            {words.archive}
          </Button>
        </SheetActions>
      }
    />
  );
}
