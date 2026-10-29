import type { TranslatedText } from '@heliogrid/contracts';
import { BRANDING_PARTS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { FormActionBar } from '../FormActionBar/FormActionBar.native';
import { ListRow } from '../ListRow/ListRow.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { BrandingPart } from './BrandingParts.native';
import type { BrandingSettingsProps, BrandingPart as Part } from './BrandingSettings.types';
import { BrandingStage } from './BrandingStage.native';

/**
 * Branding in the phone's one column (`SCR-M01-18` at 375), inside the shell's scrolling page:
 * the standing line under the bar's title, a failed save said once, the stage the customers get,
 * the editor's one part with the way to the business profile, and the line that sent proposals
 * keep their branding. A phone whose shell holds the act bar passes no `act`; given one, it ends
 * the page.
 */
export function BrandingSettings(props: BrandingSettingsProps) {
  const { words, read, unsaved, title, standing, saveFailure, onRetry, act } = props;
  const loading = read.kind !== 'ready';
  /* A saved or discarded change and a retried save take their control away: the screen reader
     goes on to the editor — the part's switch and the part, where the person goes next. */
  const editor = useRef<View>(null);
  return (
    <View style={styles.page}>
      {title === undefined && standing === undefined ? null : (
        <View style={styles.head}>
          {title === undefined ? null : <Text variant="h2">{title}</Text>}
          {standing === undefined ? null : (
            <Text
              variant="caption"
              color="secondary"
              style={title === undefined ? styles.underBarTitle : undefined}
            >
              {standing}
            </Text>
          )}
        </View>
      )}
      {saveFailure === undefined ? null : (
        <Banner
          kind="validation"
          title={words.saveFailed}
          density="functional"
          action={
            <BannerAction onClick={onRetry} focusAfter={editor}>
              {words.retry}
            </BannerAction>
          }
        >
          {saveFailure}
        </Banner>
      )}
      <BrandingStage {...props} />
      {loading ? (
        <LoadingBars label={words.loading} bars={['control', 'panel', 'row']} />
      ) : (
        <View ref={editor} collapsable={false}>
          <Editor {...props} />
        </View>
      )}
      {/* A held change raises the act bar (in the shell's foot on a phone), whose line says the same. */}
      {loading || unsaved || act !== undefined ? null : (
        <Text variant="caption" color="secondary" align="center">
          {words.sentKeep}
        </Text>
      )}
      {act === undefined ? null : (
        <FormActionBar
          placement="sticky"
          align="center"
          consequence={words.sentKeep}
          saveLabel={words.save}
          onSave={act.onSave}
          discardLabel={words.discard}
          onDiscard={act.onDiscard}
          focusAfter={editor}
          saving={act.saving}
        />
      )}
    </View>
  );
}

const PARTS: readonly Part[] = BRANDING_PARTS;

/** The editor: the part switch across the column, the part, then the business profile's row. */
function Editor(props: BrandingSettingsProps) {
  const { words, part, onPart, onOpenProfile } = props;
  const label: Record<Part, TranslatedText> = {
    logo: words.logo,
    colour: words.colour,
    letterhead: words.letterhead,
  };
  return (
    <View style={styles.editor}>
      <SegmentedControl
        ariaLabel={words.edit}
        options={PARTS.map((value) => ({ value, label: label[value] }))}
        value={part}
        onChange={(value) => {
          const chosen = PARTS.find((each) => each === value);
          if (chosen !== undefined) onPart(chosen);
        }}
        style={styles.fullWidth}
      />
      <BrandingPart {...props} />
      <View>
        <View style={styles.hairline} />
        <ListRow
          icon={<ShellGlyph name="building" size="md" tone="secondary" />}
          title={words.profileRow}
          subtitle={words.profileRowFrom}
          trailing={<ShellGlyph name="chevron-right" size="md" />}
          onClick={onOpenProfile}
          density="functional"
          style={styles.flushRow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** The page's parts, `sp-4` apart; the shell pads the sides and scrolls it. */
  page: { gap: theme.spacing['sp-4'] },
  /** A title over its standing line, `sp-1` apart. */
  head: { gap: theme.spacing['sp-1'] },
  /** Under the bar's title: past the back control and its gap (`sp-10` + `sp-4`). */
  underBarTitle: { marginLeft: theme.spacing['sp-10'] + theme.spacing['sp-4'] },
  /** The switch, the part and the profile row, `sp-4` apart. */
  editor: { gap: theme.spacing['sp-4'] },
  fullWidth: { alignSelf: 'stretch' },
  /** The soft rule over the profile row. */
  hairline: { height: 1, backgroundColor: theme.colors['line-soft'] },
  /** The row flush with the column's edges. */
  flushRow: { paddingLeft: 0, paddingRight: 0 },
});
