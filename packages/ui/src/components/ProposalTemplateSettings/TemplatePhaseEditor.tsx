import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { SheetActions } from '../Sheet/SheetActions';
import { TEMPLATE_PHASE_PANEL } from './ProposalTemplateSettings.logic';
import type { TemplatePhaseEditorProps } from './ProposalTemplateSettings.types';
import { TemplatePhaseFields } from './TemplatePhaseFields';

/**
 * The phase editor on the web (m19-g, m19-l): a sheet below the panel width, and at width a 480
 * side panel that leaves the list in reach (non-modal).
 */
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
      width={TEMPLATE_PHASE_PANEL}
      panelProps={{ modal: false }}
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
