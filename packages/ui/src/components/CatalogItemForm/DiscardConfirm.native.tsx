import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { CatalogItemFormWords } from './CatalogItemForm.types';

export interface DiscardConfirmProps {
  open: boolean;
  words: CatalogItemFormWords['discard'];
  onKeep: () => void;
  onDiscard: () => void;
}

/**
 * *Discard this panel?* (`SCR-M01-16`, s16-i): a decision over the add sheet, answered only by its
 * two buttons, since nothing was created and what was typed has no undo.
 */
export function DiscardConfirm({ open, words, onKeep, onDiscard }: DiscardConfirmProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onKeep}
      closeLabel={words.keep}
      desktop="modal"
      dismissible={false}
      showClose={false}
      density="functional"
      inset
      zIndex={60}
      title={words.title}
      modalProps={{ tone: 'warning' }}
      sheetProps={{ handle: false, showClose: false }}
      footer={
        <SheetActions>
          <Button variant="secondary" size="lg" onClick={onKeep}>
            {words.keep}
          </Button>
          <Button variant="destructive" size="lg" onClick={onDiscard}>
            {words.discard}
          </Button>
        </SheetActions>
      }
    >
      <Text variant="body-sm" color="secondary">
        <Text variant="body-sm" color="primary" bold>
          {words.lead}
        </Text>{' '}
        {words.body}
      </Text>
    </EditorSurface>
  );
}
