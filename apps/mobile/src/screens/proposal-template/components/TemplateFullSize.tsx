import type { ProposalTemplateWords } from '@heliogrid/i18n';
import {
  DocumentPreview,
  EditorSurface,
  type TemplateDocument,
  templateDocumentProps,
} from '@heliogrid/ui';
import { useWindowDimensions, View } from 'react-native';
import { switcherWidth } from '../../shell/styles';
import { styles } from '../styles';

/**
 * *Open full size* on the phone (`SCR-M01-19` m19-h): the document the stage shows, in a full sheet
 * at the page's column width, from the stage's own props, as the web's does.
 */
export function TemplateFullSize({
  open,
  words,
  closeLabel,
  document,
  onClose,
}: {
  open: boolean;
  words: ProposalTemplateWords;
  closeLabel: string;
  document: TemplateDocument;
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
      title={words.proposal}
      subtitle={words.fullSizeSubtitle}
    >
      <View style={styles.fullSize}>
        <DocumentPreview {...templateDocumentProps(document, words, switcherWidth(width))} />
      </View>
    </EditorSurface>
  );
}
