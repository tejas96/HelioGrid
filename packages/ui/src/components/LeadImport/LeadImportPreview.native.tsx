import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { ShareFilter } from '../ShareFilter/ShareFilter.native';
import { duplicateChoiceOf, partsFilterOf } from './LeadImport.props';
import type { LeadImportProps } from './LeadImport.types';

/**
 * The preview's one hero on the phone (`M02-19`, `M02-20`): the rows and the duplicates by phone
 * in the file's own count, the parts as rings that narrow the rows below, and the one choice every
 * duplicate follows — *Skip* by default, or *Log as enquiry*; never *Keep both*. The choice waits
 * while the run is out.
 */
export function LeadImportPreview(props: LeadImportProps & { wide: boolean }) {
  const { figures, words } = props;
  if (figures === null) return null;
  const filter = partsFilterOf(props, 'rings');
  return (
    <HeroPanel label={words.beforeRuns}>
      <View style={styles.preview}>
        <View style={styles.block}>
          <Text variant="display" style={styles.ink}>
            {words.counts(figures.rows, figures.duplicates)}
          </Text>
          {figures.rejected === 0 ? null : (
            <Text variant="body-sm" style={styles.muted}>
              {words.rejectedCount(figures.rejected)}
            </Text>
          )}
          {filter === null ? null : <ShareFilter {...filter} />}
        </View>
        {figures.duplicates === 0 ? null : (
          <View style={styles.block}>
            <View accessible accessibilityRole="header">
              <Text variant="overline" style={styles.muted}>
                {words.choiceHeading(figures.duplicates)}
              </Text>
            </View>
            <OptionCardGroup {...duplicateChoiceOf(props, figures.duplicates)} />
          </View>
        )}
        <View style={styles.land}>
          <LeadSourceMark source="import" label={words.sourceImport} />
          <View style={styles.landWords}>
            <Text variant="body-sm" style={styles.muted}>
              {words.landInInbox}
            </Text>
          </View>
        </View>
      </View>
    </HeroPanel>
  );
}

const styles = StyleSheet.create({
  preview: { gap: theme.spacing['sp-5'] },
  block: { gap: theme.spacing['sp-3'], minWidth: 0 },
  ink: { color: colors['on-panel'] },
  muted: { color: colors['on-panel-muted'] },
  land: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  landWords: { flexShrink: 1, minWidth: 0 },
});
