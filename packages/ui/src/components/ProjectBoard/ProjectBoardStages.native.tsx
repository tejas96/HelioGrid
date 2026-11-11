import type { TranslatedText } from '@heliogrid/contracts';
import type { ProjectBoardView, StageGroup } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { CardRows } from '../CardRows/CardRows.native';
import { ProjectRowList } from '../ProjectRows/ProjectRows.native';
import { Sheet } from '../Sheet/Sheet.native';
import { groupLineOf, stageItemsOf } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardSection } from './ProjectBoardSection.native';
import { useHeld } from './use-held';

type StagesProps = ProjectBoardProps & { view: ProjectBoardView };

/** *All projects* on the phone: the stage pill and its sheet, then each stage's card of rows. */
export function ProjectBoardStages(props: StagesProps) {
  const { view, words, onChooseStage } = props;
  const [choosing, setChoosing] = useState(false);
  const choose = (stage: ProjectBoardView['chosen']) => {
    onChooseStage(stage);
    setChoosing(false);
  };
  return (
    <ProjectBoardSection
      title={words.allProjects}
      end={<StagePill view={view} words={words} onPress={() => setChoosing(true)} />}
    >
      {view.groups.map((group) => (
        <Group key={group.stage} group={group} {...props} />
      ))}
      <Sheet
        open={choosing}
        onClose={() => setChoosing(false)}
        title={words.showStage}
        subtitle={words.showStageLine}
        closeLabel={words.close}
      >
        <View style={styles.options}>
          <Option
            label={words.allStages}
            line={null}
            count={view.liveCount}
            chosen={view.chosen === null}
            onPress={() => choose(null)}
          />
          {view.stops.map((stop) => (
            <Option
              key={stop.stage}
              label={words.stage(stop.stage)}
              line={words.stopLine(stop) ?? words.noneNow}
              count={stop.count}
              chosen={stop.chosen}
              onPress={() => choose(stop.stage)}
            />
          ))}
        </View>
      </Sheet>
    </ProjectBoardSection>
  );
}

/** The pill naming the stage shown; a chosen stage is the accent wash. */
function StagePill({
  view,
  words,
  onPress,
}: Pick<StagesProps, 'view' | 'words'> & { onPress: () => void }) {
  const { controlFill } = useGround();
  const chosen = view.chosen !== null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={words.showStage}
      onPress={onPress}
      style={[styles.pill, chosen ? styles.pillChosen : { backgroundColor: controlFill }]}
    >
      <Text variant="body-sm" bold color={chosen ? 'accent' : 'primary'}>
        {view.chosen === null ? words.allStages : words.stage(view.chosen)}
      </Text>
      <ShellGlyph name="caret-down" size="sm" tone={chosen ? 'accent' : 'secondary'} />
    </Pressable>
  );
}

function Option({
  label,
  line,
  count,
  chosen,
  onPress,
}: {
  label: TranslatedText;
  line: TranslatedText | null;
  count: number;
  chosen: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: chosen }}
      onPress={onPress}
      style={[styles.option, chosen ? styles.optionChosen : undefined]}
    >
      <View style={styles.optionWords}>
        <Text variant="body" bold color={chosen ? 'accent' : 'primary'}>
          {label}
        </Text>
        {line === null ? null : (
          <Text variant="caption" color="secondary">
            {line}
          </Text>
        )}
      </View>
      <Text variant="mono" color={chosen ? 'accent' : 'secondary'}>
        {String(count)}
      </Text>
    </Pressable>
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
        <CardRows>
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    minHeight: theme.layout['touch-min'],
    paddingStart: theme.spacing['sp-4'],
    paddingEnd: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  pillChosen: { backgroundColor: colors['accent-subtle'] },
  options: { gap: theme.spacing['sp-2'] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-16'],
    paddingHorizontal: theme.spacing['sp-4'],
    paddingVertical: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
    backgroundColor: colors.fill,
  },
  optionChosen: { backgroundColor: colors['accent-subtle'] },
  optionWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
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
