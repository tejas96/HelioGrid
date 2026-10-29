import type { TranslatedText } from '@heliogrid/contracts';
import type { LeaveAsk } from '@heliogrid/data/react';
import type { BrandingWords } from '@heliogrid/i18n';
import { Button, LeaveConfirm, Modal, ModalActions, Text } from '@heliogrid/ui';

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
  closeLabel: TranslatedText;
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

/** *Leave without saving?* (s18-w): the shared confirm with Branding's words, the ask `packages/data`'s `useLeaveAsk` holds. */
export function BrandingLeaveAsk({ words, leave }: { words: BrandingWords; leave: LeaveAsk }) {
  return (
    <LeaveConfirm
      open={leave.asking}
      title={words.leaveTitle}
      body={words.leaveBody}
      discard={words.leaveConfirm}
      keep={words.keepEditing}
      onKeep={leave.stay}
      onLeave={leave.leave}
    />
  );
}
