import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { SheetActions } from '../Sheet/SheetActions';
import type { TemplatePhaseDeleteProps } from './ProposalTemplateSettings.types';

/**
 * *Delete {phase}?* (m19-n7) on the web: a danger ask that says the delete lands only on save.
 * Stacked at every width, as the board draws it: side by side a label wraps.
 */
export function TemplatePhaseDelete({
  phase,
  closeLabel,
  words,
  onDelete,
  onKeep,
}: TemplatePhaseDeleteProps) {
  return (
    <Modal
      open={phase !== null}
      onClose={onKeep}
      closeLabel={closeLabel}
      tone="danger"
      size="sm"
      density="functional"
      title={words.deleteTitle(phase ?? '')}
      description={words.deleteBody}
      showClose
      dismissible
      footer={
        <SheetActions stackBelow={Number.POSITIVE_INFINITY}>
          <Button variant="destructive" size="lg" onClick={onDelete}>
            {words.deleteConfirm}
          </Button>
          <Button variant="ghost" size="lg" onClick={onKeep}>
            {words.keep}
          </Button>
        </SheetActions>
      }
    />
  );
}
