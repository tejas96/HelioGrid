import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { TemplatePhaseEditorProps } from './ProposalTemplateSettings.types';
import { TemplatePhaseFields } from './TemplatePhaseFields.native';

/** The phase editor on the phone (m19-g): a sheet over the list, its two acts at its foot. */
export function TemplatePhaseEditor({
  open,
  title,
  subtitle,
  closeLabel,
  words,
  fields,
  onClose,
  onSave,
}: TemplatePhaseEditorProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={closeLabel}
      showClose
      density="functional"
      size="auto"
      title={title}
      subtitle={subtitle}
      footer={
        <SheetActions>
          <Button variant="ghost" size="md" onClick={onClose}>
            {words.cancel}
          </Button>
          <Button variant="primary" size="md" onClick={onSave}>
            {words.act}
          </Button>
        </SheetActions>
      }
    >
      <TemplatePhaseFields words={words} {...fields} />
    </EditorSurface>
  );
}
