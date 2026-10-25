import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { SheetActions } from '../Sheet/SheetActions';
import type { LeaveConfirmProps } from './LeaveConfirm.types';

export function LeaveConfirm({
  open,
  title,
  body,
  discard,
  keep,
  onKeep,
  onLeave,
}: LeaveConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onKeep}
      // No close draws; the keep answer names the dialog's way back for a screen reader.
      closeLabel={keep}
      tone="warning"
      size="sm"
      density="functional"
      title={title}
      description={body}
      showClose={false}
      dismissible={false}
      // Stacked at every width, as both boards draw the confirm: side by side at 1536 a label wraps.
      footer={
        <SheetActions stackBelow={Number.POSITIVE_INFINITY}>
          <Button variant="destructive" size="lg" onClick={onLeave}>
            {discard}
          </Button>
          <Button variant="ghost" size="lg" onClick={onKeep}>
            {keep}
          </Button>
        </SheetActions>
      }
    />
  );
}
