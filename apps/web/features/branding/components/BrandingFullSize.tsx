import type { BrandingWords } from '@heliogrid/i18n';
import {
  BRANDING_FULL_SIZE,
  type BrandingDocumentFacts,
  BrandingLinkPage,
  type BrandingPreview,
  brandingCoverProps,
  DocumentPreview,
  EditorSurface,
} from '@heliogrid/ui';

/**
 * *Open full size* (`SCR-M01-18` m18-f, d18-i): what the stage shows, larger — a full sheet below
 * the panel width, and at width a side panel that leaves the editor in reach (non-modal), so an
 * edit redraws it in place. The cover is the stage's own props (`brandingCoverProps`), so the two
 * cannot differ.
 */
export function BrandingFullSize({
  open,
  onClose,
  preview,
  words,
  closeLabel,
  document,
  colour,
}: {
  open: boolean;
  onClose: () => void;
  preview: BrandingPreview;
  words: BrandingWords;
  closeLabel: string;
  document: BrandingDocumentFacts;
  colour: string | null;
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
      title={preview === 'link' ? words.linkPage : words.coverTitle}
    >
      {({ panel }) =>
        preview === 'link' ? (
          <BrandingLinkPage words={words} document={document} colour={colour} fullHeight />
        ) : (
          <DocumentPreview
            {...brandingCoverProps(document, colour, words)}
            width={panel ? BRANDING_FULL_SIZE.wide : BRANDING_FULL_SIZE.narrow}
          />
        )
      }
    </EditorSurface>
  );
}
