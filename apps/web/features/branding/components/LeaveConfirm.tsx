import type { BrandingWords } from '@heliogrid/i18n';
import { Button, Modal, SheetActions } from '@heliogrid/ui';

/**
 * *Leave without saving?* (`SCR-M01-18` s18-w): the move away waits on an answer — no close and
 * no dismissal, or a stray click outside would leave the change neither kept nor dropped.
 */
export function LeaveConfirm({
  open,
  words,
  closeLabel,
  onLeave,
  onStay,
}: {
  open: boolean;
  words: Pick<BrandingWords, 'leaveTitle' | 'leaveBody' | 'leaveConfirm' | 'keepEditing'>;
  closeLabel: string;
  onLeave: () => void;
  onStay: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      closeLabel={closeLabel}
      tone="warning"
      size="sm"
      density="functional"
      title={words.leaveTitle}
      description={words.leaveBody}
      showClose={false}
      dismissible={false}
      // Stacked at every width, as the board draws the confirm: side by side at 1536 a label wraps.
      footer={
        <SheetActions stackBelow={Number.POSITIVE_INFINITY}>
          <Button variant="destructive" size="lg" onClick={onLeave}>
            {words.leaveConfirm}
          </Button>
          <Button variant="ghost" size="lg" onClick={onStay}>
            {words.keepEditing}
          </Button>
        </SheetActions>
      }
    />
  );
}
