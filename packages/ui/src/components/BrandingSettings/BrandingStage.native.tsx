import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Surface } from '../../primitives/Surface/Surface.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview.native';
import { IconButton } from '../IconButton/IconButton.native';
import { PreviewFrame } from '../PreviewFrame/PreviewFrame.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { BrandingLinkPage } from './BrandingLinkPage.native';
import {
  BRANDING_SHEET,
  BRANDING_STAGE,
  brandingCoverProps,
  brandingStageShort,
} from './BrandingSettings.logic';
import type { BrandingPreview, BrandingSettingsProps } from './BrandingSettings.types';

type StageProps = Pick<
  BrandingSettingsProps,
  | 'words'
  | 'loading'
  | 'preview'
  | 'onPreview'
  | 'part'
  | 'document'
  | 'unsaved'
  | 'colour'
  | 'logoRefusal'
  | 'onOpenFullSize'
>;

/**
 * What the customers get, on the sunken stage: the cover or the link page in one window, then the
 * switch between them and *Open full size*. The window is cut shorter while the part under it must
 * stay in view (s18-n, s18-o, s18-u, s18-p). While the reads are out the window keeps the sheet's
 * footprint and names what it loads, with no subject in it (s18-j).
 */
export function BrandingStage({
  words,
  loading,
  preview,
  onPreview,
  part,
  document,
  unsaved,
  colour,
  logoRefusal,
  onOpenFullSize,
}: StageProps) {
  const maxHeight = brandingStageShort(part, colour, logoRefusal)
    ? BRANDING_STAGE.shortHeight
    : BRANDING_STAGE.maxHeight;
  const frame = { designWidth: BRANDING_SHEET.width, minScale: BRANDING_STAGE.minScale, maxHeight };
  const note = unsaved ? words.notSaved : undefined;
  return (
    <Surface background="canvas-sunken" radius="lg" style={styles.stage}>
      {loading ? (
        <PreviewFrame
          {...frame}
          surface="sheet"
          designHeight={BRANDING_SHEET.height}
          loading
          loadingLabel={words.loadingCover}
        />
      ) : preview === 'proposal' ? (
        <PreviewFrame {...frame} surface="sheet" designHeight={BRANDING_SHEET.height} note={note}>
          <DocumentPreview
            {...brandingCoverProps(document, colour, words)}
            width={BRANDING_SHEET.width}
          />
        </PreviewFrame>
      ) : (
        <PreviewFrame {...frame} surface="page" note={note}>
          <BrandingLinkPage words={words} document={document} colour={colour} />
        </PreviewFrame>
      )}
      <View style={styles.switchRow}>
        <View style={styles.switchHolder}>
          <SegmentedControl
            ariaLabel={words.preview}
            options={[
              { value: 'proposal', label: words.proposal },
              { value: 'link', label: words.linkPage },
            ]}
            value={preview}
            onChange={(value) => onPreview(previewOf(value))}
          />
        </View>
        <IconButton label={words.openFullSize} size={40} variant="surface" onClick={onOpenFullSize}>
          <ShellGlyph name="expand" size="sm" tone="primary" />
        </IconButton>
      </View>
    </Surface>
  );
}

/** The switch reports a string; only the two surfaces it offers come back from it. */
function previewOf(value: string): BrandingPreview {
  return value === 'link' ? 'link' : 'proposal';
}

const styles = StyleSheet.create({
  /** The stage: the window, then the switch row, `sp-3` apart inside `sp-3` (`SCR-M01-18` at 375). */
  stage: { padding: theme.spacing['sp-3'], gap: theme.spacing['sp-3'] },
  /** The surface switch, a spacer, and *Open full size*, `sp-3` apart. */
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  /**
   * The switch takes the row's free width: the phone's `SegmentedControl` splits its width into
   * equal segments and has no fit-to-its-words width, so at its content width its words break a
   * letter a line (`D360`).
   */
  switchHolder: { flexGrow: 1 },
});
