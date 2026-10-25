import type { ProposalTemplateWords } from '@heliogrid/i18n';
import {
  BRANDING_FULL_SIZE,
  DocumentPreview,
  EditorSurface,
  type TemplateDocument,
  templateDocumentProps,
} from '@heliogrid/ui';

/**
 * *Open full size* (`SCR-M01-19` m19-h, m19-m): the document the stage shows, larger — a full sheet
 * below the panel width, and at width a 720 side panel that leaves the editor in reach
 * (non-modal), so an edit redraws it in place. Its props are the stage's (`templateDocumentProps`).
 */
export function TemplateFullSize({
  open,
  onClose,
  words,
  closeLabel,
  document,
}: {
  open: boolean;
  onClose: () => void;
  words: ProposalTemplateWords;
  closeLabel: string;
  document: TemplateDocument;
}) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={closeLabel}
      showClose
      density="functional"
      size="full"
      width={BRANDING_FULL_SIZE.panel}
      panelProps={{ modal: false }}
      title={words.proposal}
      subtitle={words.fullSizeSubtitle}
    >
      {({ panel }) => (
        <DocumentPreview
          {...templateDocumentProps(
            document,
            words,
            panel ? BRANDING_FULL_SIZE.wide : BRANDING_FULL_SIZE.narrow,
          )}
        />
      )}
    </EditorSurface>
  );
}
