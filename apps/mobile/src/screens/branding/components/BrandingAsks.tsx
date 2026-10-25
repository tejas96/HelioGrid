import type { BrandingWords } from '@heliogrid/i18n';
import { Button, Modal, ModalActions, Text } from '@heliogrid/ui';

/**
 * *Remove your logo?* (`SCR-M01-18` s18-q): a danger ask the person may close or dismiss; nothing
 * changes until *Remove logo*, which clears the logo in the draft and raises the act bar.
 */
export function RemoveLogoAsk({
  open,
  words,
  closeLabel,
  onKeep,
  onRemove,
}: {
  open: boolean;
  words: BrandingWords;
  closeLabel: string;
  onKeep: () => void;
  onRemove: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onKeep}
      closeLabel={closeLabel}
      tone="danger"
      size="sm"
      density="functional"
      showClose
      dismissible
      title={words.removeTitle}
      description={words.removeBody}
      footer={
        <ModalActions stackBelow={Number.POSITIVE_INFINITY}>
          <Button variant="destructive" size="lg" onClick={onRemove}>
            {words.removeConfirm}
          </Button>
          <Button variant="ghost" size="lg" onClick={onKeep}>
            {words.keep}
          </Button>
        </ModalActions>
      }
    >
      <Text variant="body-sm" color="secondary" align="center">
        {words.sentKeep}
      </Text>
    </Modal>
  );
}

/**
 * *Leave without saving?* (`SCR-M01-18` s18-w): a warning answered only by its two buttons, since
 * a change dropped here has no undo.
 */
export function LeaveAsk({
  open,
  words,
  onStay,
  onLeave,
}: {
  open: boolean;
  words: BrandingWords;
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      closeLabel={words.keepEditing}
      tone="warning"
      size="sm"
      density="functional"
      showClose={false}
      dismissible={false}
      title={words.leaveTitle}
      description={words.leaveBody}
      footer={
        <ModalActions stackBelow={Number.POSITIVE_INFINITY}>
          <Button variant="destructive" size="lg" onClick={onLeave}>
            {words.leaveConfirm}
          </Button>
          <Button variant="ghost" size="lg" onClick={onStay}>
            {words.keepEditing}
          </Button>
        </ModalActions>
      }
    />
  );
}
