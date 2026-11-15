import { Button } from '../Button/Button.native';
import { Sheet } from '../Sheet/Sheet.native';
import type { PartSheetFrameProps } from './ProposalPartSheets.types';

/** A part sheet's frame on the phone: the same parts as the web half, *Done* in the sheet's foot. */
export function PartSheetFrame({ open, onClose, words, done, children }: PartSheetFrameProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      closeLabel={words.closeLabel}
      showClose
      title={words.title}
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
    </Sheet>
  );
}
