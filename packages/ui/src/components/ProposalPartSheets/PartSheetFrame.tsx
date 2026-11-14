import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import type { PartSheetFrameProps } from './ProposalPartSheets.types';

/** A part sheet's frame: its title and close, its fields, and *Done* in the sheet's own foot. */
export function PartSheetFrame({ open, onClose, words, done, children }: PartSheetFrameProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.closeLabel}
      showClose
      title={words.title}
      desktop="modal"
      footer={
        done === null ? undefined : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={done.disabled}
            onClick={done.press}
          >
            {words.done}
          </Button>
        )
      }
    >
      {children}
    </EditorSurface>
  );
}
