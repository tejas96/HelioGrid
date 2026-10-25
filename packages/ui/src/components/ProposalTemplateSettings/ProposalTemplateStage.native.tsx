import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Surface } from '../../primitives/Surface/Surface.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { BRANDING_SHEET } from '../BrandingSettings/BrandingSettings.logic';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview.native';
import { IconButton } from '../IconButton/IconButton.native';
import { PreviewFrame } from '../PreviewFrame/PreviewFrame.native';
import {
  TEMPLATE_STAGE_MIN_SCALE,
  templateDocumentProps,
  templateStageHeight,
} from './ProposalTemplateSettings.logic';
import type { ProposalTemplateSettingsProps } from './ProposalTemplateSettings.types';

type StageProps = Pick<
  ProposalTemplateSettingsProps,
  'words' | 'loading' | 'part' | 'document' | 'unsaved' | 'onOpenFullSize'
>;

/**
 * The PDF the customer opens, on the sunken stage (`Stage 375`): one window cut to 186 while Cover
 * or Sections is open and 120 while Terms or Timeline is, then the caption and *Open full size*.
 * *Not saved yet* only while the template record differs from the saved one. While the reads are
 * out the window names what it loads, with no document in it (m19-n1).
 */
export function ProposalTemplateStage({
  words,
  loading,
  part,
  document,
  unsaved,
  onOpenFullSize,
}: StageProps) {
  const frame = {
    surface: 'sheet' as const,
    designWidth: BRANDING_SHEET.width,
    minScale: TEMPLATE_STAGE_MIN_SCALE,
    maxHeight: templateStageHeight(part),
  };
  return (
    <Surface background="canvas-sunken" radius="lg" style={styles.stage}>
      {loading ? (
        <PreviewFrame {...frame} loading loadingLabel={words.loadingPreview} />
      ) : (
        <PreviewFrame {...frame} note={unsaved ? words.notSaved : undefined}>
          <DocumentPreview {...templateDocumentProps(document, words, BRANDING_SHEET.width)} />
        </PreviewFrame>
      )}
      <View style={styles.captionRow}>
        <View style={styles.caption}>
          <Text variant="caption" color="secondary">
            {words.stageCaption}
          </Text>
        </View>
        <IconButton label={words.openFullSize} size={40} variant="surface" onClick={onOpenFullSize}>
          <ShellGlyph name="expand" size="sm" tone="primary" />
        </IconButton>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  /** The stage: the window, then the caption row, `sp-3` apart inside `sp-3`. */
  stage: { padding: theme.spacing['sp-3'], gap: theme.spacing['sp-3'] },
  /** The caption takes the row's free width; *Open full size* keeps its own, `sp-3` from it. */
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  caption: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
});
