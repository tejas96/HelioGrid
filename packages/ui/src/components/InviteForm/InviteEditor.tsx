import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { SheetActions } from '../Sheet/SheetActions';
import { InviteForm } from './InviteForm';
import type { InviteEditorProps } from './InviteForm.types';

/** The invite as an editor over Team: Cancel before Send invite, the primary at the trailing edge. */
export function InviteEditor({
  open,
  onClose,
  bind,
  words,
  roles,
  sending,
  onSend,
  presses,
}: InviteEditorProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      title={words.title}
      width={480}
      footer={
        <div className="hg-invite-editor-foot">
          <SheetActions>
            <Button variant="ghost" size="lg" onClick={onClose}>
              {words.cancel}
            </Button>
            <Button variant="primary" size="lg" loading={sending} onClick={onSend}>
              {words.send}
            </Button>
          </SheetActions>
          <Text variant="caption" color="secondary" align="center">
            {words.lasts}
          </Text>
        </div>
      }
    >
      <InviteForm bind={bind} words={words} roles={roles} heading="quiet" presses={presses} />
    </EditorSurface>
  );
}
