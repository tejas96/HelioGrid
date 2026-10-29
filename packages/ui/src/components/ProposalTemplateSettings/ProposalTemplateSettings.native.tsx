import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { useFocusAfterGone } from '../BrandingSettings/use-focus-after-gone.native';
import { FormActionBar } from '../FormActionBar/FormActionBar.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { TemplateLinks, TemplatePart, TemplatePartSwitch } from './ProposalTemplateParts.native';
import type { ProposalTemplateSettingsProps } from './ProposalTemplateSettings.types';
import { ProposalTemplateStage } from './ProposalTemplateStage.native';

/**
 * The Proposal template in the phone's one column (`SCR-M01-19` at 375), inside the shell's
 * scrolling page: the standing and Quick lines under the bar's title, the PDF the customer opens,
 * the teaching banner while every part is HelioGrid's, the editor's one part with the two rows,
 * and the page's end. A phone whose shell holds the act bar passes no `act` and draws the bar and
 * the failure banner there; given one, the page ends with them.
 */
export function ProposalTemplateSettings(props: ProposalTemplateSettingsProps) {
  const { words, read, title, standing, teaching, saveFailed, act } = props;
  const loading = read.kind !== 'ready';
  const editor = useRef<View>(null);
  /* Branding's phone hook is this page's rule too: it follows a bar this page draws, never a logo. */
  useFocusAfterGone(editor, {
    act: act !== undefined,
    failure: act !== undefined && saveFailed,
    logo: false,
  });
  const standingShown = loading ? undefined : standing;
  return (
    <View style={styles.page}>
      <View style={[styles.head, title === undefined ? styles.underBarTitle : styles.titled]}>
        {title === undefined ? null : <Text variant="h2">{title}</Text>}
        {standingShown === undefined ? null : (
          <Text variant="caption" color="secondary">
            {standingShown}
          </Text>
        )}
        <Text variant="caption" color="secondary">
          {words.intro}
        </Text>
      </View>
      <ProposalTemplateStage {...props} />
      {teaching && !loading ? (
        <Banner kind="info" title={words.teachTitle} density="functional">
          {words.teachBody}
        </Banner>
      ) : null}
      {loading ? (
        <LoadingBars label={words.loading} bars={['control', 'panel', 'row']} />
      ) : (
        <View ref={editor} collapsable={false} style={styles.editor}>
          <TemplatePartSwitch {...props} />
          <TemplatePart {...props} />
          <TemplateLinks {...props} />
        </View>
      )}
      {loading || props.held || act !== undefined ? null : (
        <Text variant="caption" color="secondary" align="center">
          {words.pageEnd}
        </Text>
      )}
      {act === undefined ? null : (
        <View>
          {saveFailed ? (
            <View style={styles.failure}>
              <Banner kind="state" tone="danger" title={words.saveFailed} density="functional">
                {words.saveFailedBody}
              </Banner>
            </View>
          ) : null}
          <FormActionBar
            placement="sticky"
            align="center"
            consequence={words.consequence}
            saveLabel={words.save}
            onSave={act.onSave}
            discardLabel={words.discard}
            onDiscard={act.onDiscard}
            saving={act.saving}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** The page's parts, `sp-4` apart; the shell pads the sides and scrolls it. */
  page: { gap: theme.spacing['sp-4'] },
  /** The standing and Quick lines, `sp-0-5` apart (`Intro 375`). */
  head: { gap: theme.spacing['sp-0-5'] },
  /** Under a drawn title, `sp-1` apart. */
  titled: { gap: theme.spacing['sp-1'] },
  /** Under the bar's title: past the back control and its gap (`sp-10` + `sp-4`). */
  underBarTitle: { marginLeft: theme.spacing['sp-10'] + theme.spacing['sp-4'] },
  /** The switch, the part and the two rows, `sp-4` apart. */
  editor: { gap: theme.spacing['sp-4'] },
  /** The failed save over the act bar, `sp-3` above and below (m19-n4). */
  failure: { paddingVertical: theme.spacing['sp-3'] },
});
