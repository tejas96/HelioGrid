import type { ProjectDetail as ProjectDetailFacts } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { HueTile } from '../HueTile/HueTile.native';
import { PARTY_GLYPH, TILE_STROKE, waitDaysOf } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';

type OpenWait = NonNullable<ProjectDetailFacts['wait']>;

/**
 * Who the project waits on, on the phone: the open wait with *Wait is over* and, for a customer,
 * *Remind*; with none open, a quiet ask to say who — for a reader who moves stages, on a live one.
 */
export function ProjectWait(props: ProjectDetailProps) {
  const { project, view, words, onWait, sending } = props;
  if (view.closed) return null;
  if (project.wait !== null) return <WaitCard {...props} wait={project.wait} />;
  if (!project.acts.stages) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={words.noWaitTitle}
      accessibilityHint={words.noWaitLine}
      ripple="bounded"
      onPress={() => {
        if (!sending) onWait();
      }}
      style={styles.ask}
    >
      <HueTile glyph="clock" hue="neutral" size={40} stroke={TILE_STROKE} />
      <View style={styles.words}>
        <Text variant="body" bold>
          {words.noWaitTitle}
        </Text>
        <Text variant="caption" color="secondary">
          {words.noWaitLine}
        </Text>
      </View>
      <ShellGlyph name="chevron-right" size="md" tone="secondary" />
    </Pressable>
  );
}

/** The open wait; *Wait is over* leaves with the card and the reader lands on the hero's act. */
function WaitCard({
  project,
  words,
  onWaitOver,
  onRemind,
  sending,
  heroFocus,
  wait,
}: ProjectDetailProps & { wait: OpenWait }) {
  const leaving = useFocusAfter(heroFocus);
  return (
    <Card density="functional">
      <View style={styles.card}>
        <View style={styles.head}>
          <HueTile
            glyph={PARTY_GLYPH[wait.party] ?? 'clock'}
            hue="warning"
            size={40}
            stroke={TILE_STROKE}
          />
          <View style={styles.words}>
            <Text variant="body" bold>
              {words.waitTitle(wait.party)}
            </Text>
            <Text variant="caption" color="secondary">
              {words.waitLine(wait.reason, wait.startedOn)}
            </Text>
            {wait.note === null ? null : (
              <Text variant="caption" color="secondary">
                {wait.note}
              </Text>
            )}
          </View>
          <Text variant="mono" oneLine>
            {words.days(waitDaysOf(project))}
          </Text>
        </View>
        {project.acts.stages ? (
          <View style={styles.acts}>
            <Button
              variant="secondary"
              size="sm"
              icon={<ShellGlyph name="tick" size="sm" tone="primary" />}
              onClick={leaving(() => {
                if (!sending) onWaitOver();
              })}
            >
              {words.waitOver}
            </Button>
            {wait.party === 'customer' ? (
              <Button
                variant="secondary"
                size="sm"
                icon={<ShellGlyph name="send" size="sm" tone="primary" />}
                onClick={onRemind}
              >
                {words.remind}
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing['sp-3'] },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    paddingLeft: theme.spacing['sp-10'] + theme.spacing['sp-3'],
  },
  /* A quiet tile edged by a ring — an empty place to fill. The radius sits on the target itself,
     so Android's ripple keeps to the round corners. */
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    paddingVertical: theme.spacing['sp-3'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    borderRadius: theme.radius['r-card-expressive'],
  },
});
