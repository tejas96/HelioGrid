import { Button } from '../Button/Button.native';
import { Modal } from '../Modal/Modal.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { TemplatePhaseDeleteProps } from './ProposalTemplateSettings.types';

/** *Delete {phase}?* (m19-n7) on the phone: a danger ask that says the delete lands only on save. */
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
      showClose
      dismissible
      title={words.deleteTitle(phase ?? '')}
      description={words.deleteBody}
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
