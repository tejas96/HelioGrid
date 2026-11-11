import type { ProjectBoardView, StageGroup } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { CardRows } from '../CardRows/CardRows.native';
import { ProjectRowList } from '../ProjectRows/ProjectRows.native';
import { groupLineOf, stageItemsOf } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardSection } from './ProjectBoardSection.native';
import { useHeld } from './use-held';

type StagesProps = ProjectBoardProps & { view: ProjectBoardView };

/** *All projects* on the phone: each stage holding a project — or the one the chips chose — and its cards. */
export function ProjectBoardStages(props: StagesProps) {
  const { view, words } = props;
  return (
    <ProjectBoardSection title={words.allProjects} end={null}>
      {view.groups.map((group) => (
        <Group key={group.stage} group={group} {...props} />
      ))}
    </ProjectBoardSection>
  );
}

/** One stage's projects on the phone: its overline, count and longest stay, then its card. */
function Group(props: StagesProps & { group: StageGroup }) {
  const { group, view, words } = props;
  const held = useHeld();
  const line = groupLineOf(view, group, words);
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <View accessible accessibilityRole="header">
          <Text variant="overline">{words.stage(group.stage)}</Text>
        </View>
        <Text variant="mono" color="secondary">
          {String(group.rows.length)}
        </Text>
        {line === null ? null : (
          <View style={styles.groupLine}>
            <Text variant="caption" color="secondary">
              {line}
            </Text>
          </View>
        )}
      </View>
      {group.rows.length === 0 ? (
        <CardRows form="joined">
          <View style={styles.none}>
            <Text variant="body-sm" color="secondary" align="center">
              {words.noneInStage(group.stage)}
            </Text>
          </View>
        </CardRows>
      ) : (
        <ProjectRowList items={stageItemsOf(group.rows, held, props)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-2'] },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  groupLine: { marginStart: 'auto' },
  none: { padding: theme.spacing['sp-5'] },
});
