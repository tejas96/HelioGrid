import type { TranslatedText } from '@heliogrid/contracts';
import type { BrandingWords } from '@heliogrid/i18n';
import { Button, Modal, SheetActions, Text } from '@heliogrid/ui';

/**
 * *Remove your logo?* (`SCR-M01-18` s18-q): asks before the draft drops the logo. Closable and
 * dismissible — keeping the logo is the safe answer, so any way out keeps it.
 */
export function RemoveLogoConfirm({
  open,
  words,
  closeLabel,
  onRemove,
  onKeep,
}: {
  open: boolean;
  closeLabel: TranslatedText;
  words: Pick<BrandingWords, 'removeTitle' | 'removeBody' | 'sentKeep' | 'removeConfirm' | 'keep'>;
  onRemove: () => void;
  onKeep: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onKeep}
      closeLabel={closeLabel}
      tone="danger"
      size="sm"
      density="functional"
      title={words.removeTitle}
      description={words.removeBody}
      showClose
      dismissible
      // Stacked at every width, as the board draws the confirm: side by side at 1536 a label wraps.
      footer={
        <SheetActions stackBelow={Number.POSITIVE_INFINITY}>
          <Button variant="destructive" size="lg" onClick={onRemove}>
            {words.removeConfirm}
          </Button>
          <Button variant="ghost" size="lg" onClick={onKeep}>
            {words.keep}
          </Button>
        </SheetActions>
      }
    >
      <Text variant="body-sm" color="secondary" align="center">
        {words.sentKeep}
      </Text>
    </Modal>
  );
}
