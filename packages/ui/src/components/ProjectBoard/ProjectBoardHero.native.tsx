import type { ProjectBoardView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { HueTile } from '../HueTile/HueTile.native';
import { KIND_TILE } from '../ProjectRows/ProjectRows.logic';
import type { ProjectBoardWords } from './ProjectBoard.types';

/** The day's hero on the phone: the day, to do and waiting — or that nothing needs the person. */
export function ProjectBoardHero({
  view,
  words,
}: {
  view: ProjectBoardView;
  words: ProjectBoardWords;
}) {
  return (
    <HeroPanel label={words.today(view.today)}>
      {view.allClear ? (
        <View style={styles.clear}>
          <HueTile glyph="tick" hue="success" {...KIND_TILE.hero} />
          <View style={styles.clearWords}>
            <Text variant="figure">{words.allClearTitle}</Text>
            <Text variant="body-sm" color="secondary">
              {words.allClearBody(view.liveCount)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.figures}>
          <View style={styles.figure}>
            <Text variant="hero">{String(view.todoCount)}</Text>
            <Text variant="body" bold>
              {words.toDo}
            </Text>
          </View>
          <View style={styles.rule} />
          <View style={styles.figure}>
            <Text variant="hero" color="secondary">
              {String(view.waitCount)}
            </Text>
            <Text variant="body" bold color="secondary">
              {words.waiting}
            </Text>
          </View>
        </View>
      )}
    </HeroPanel>
  );
}

const styles = StyleSheet.create({
  figures: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing['sp-5'] },
  figure: { gap: theme.spacing['sp-1'] },
  rule: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
    marginVertical: theme.spacing['sp-2'],
    backgroundColor: colors['line-soft'],
  },
  clear: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  clearWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
