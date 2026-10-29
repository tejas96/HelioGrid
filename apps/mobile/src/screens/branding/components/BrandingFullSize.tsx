import type { TranslatedText } from '@heliogrid/contracts';
import type { BrandingWords } from '@heliogrid/i18n';
import {
  type BrandingDocumentFacts,
  BrandingLinkPage,
  type BrandingPreview,
  brandingCoverProps,
  DocumentPreview,
  EditorSurface,
} from '@heliogrid/ui';
import { useWindowDimensions, View } from 'react-native';
import { switcherWidth } from '../../shell/styles';
import { styles } from '../styles';

/**
 * *Open full size* on the phone (`SCR-M01-18` m18-f): what the stage shows, in a full sheet at the
 * page's column width — the cover from the stage's own props, or the link page — so the two never
 * differ, as the web's does.
 */
export function BrandingFullSize({
  open,
  preview,
  words,
  closeLabel,
  document,
  colour,
  onClose,
}: {
  open: boolean;
  preview: BrandingPreview;
  words: BrandingWords;
  closeLabel: TranslatedText;
  document: BrandingDocumentFacts;
  colour: string | null;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={closeLabel}
      showClose
      size="full"
      density="functional"
      title={preview === 'link' ? words.linkPage : words.coverTitle}
    >
      <View style={styles.fullSize}>
        {preview === 'link' ? (
          <BrandingLinkPage words={words} document={document} colour={colour} />
        ) : (
          <DocumentPreview
            {...brandingCoverProps(document, colour, words)}
            width={switcherWidth(width)}
          />
        )}
      </View>
    </EditorSurface>
  );
}
