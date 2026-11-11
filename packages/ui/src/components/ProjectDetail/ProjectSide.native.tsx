import { PROJECT_STAGE_CHAIN } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Card } from '../Card/Card.native';
import { useFormat } from '../MarketProvider';
import { Timeline } from '../Timeline/Timeline.native';
import { projectEventsOf } from './ProjectDetail.activity';
import { journeyItemsOf } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { CardHead } from './ProjectDetailParts.native';

/** Every stage of the deal's chain with its date and who or what moved it — never a % bar. */
export function ProjectJourney(props: ProjectDetailProps) {
  const format = useFormat();
  const { words } = props;
  const sun = <ShellGlyph name="sun" size="sm" tone="inverse" />;
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.journey} aside={words.journeyNote} />
      <View style={styles.pad}>
        <Timeline variant="page" density="functional" items={journeyItemsOf(props, format, sun)} />
      </View>
    </Card>
  );
}

/** The latest of what happened on the project, newest first — nothing edits after the fact. */
export function ProjectActivity({ project, words }: ProjectDetailProps) {
  const format = useFormat();
  const events = projectEventsOf(project, words, format, PROJECT_STAGE_CHAIN);
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.activity} aside={words.activityNote} />
      {events.map((event, index) => (
        <View key={event.key} style={[styles.row, index === 0 ? undefined : styles.rule]}>
          <View style={styles.main}>
            <Text variant="body-sm">{event.title}</Text>
            {event.line === null ? null : (
              <Text variant="caption" color="secondary">
                {event.line}
              </Text>
            )}
          </View>
          <Text variant="caption" color="secondary" oneLine>
            {event.on}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  pad: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-2'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-12'] + theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
  },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
