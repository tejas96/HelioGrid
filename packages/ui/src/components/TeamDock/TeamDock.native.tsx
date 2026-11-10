import { theme } from '@heliogrid/theme';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { loadSharesOf } from '../AssignPicker/AssignPicker.logic';
import type { AssignPickerPerson } from '../AssignPicker/AssignPicker.types';
import { Avatar } from '../Avatar/Avatar.native';
import { dockColumnsOf, dockedOf, shortNameOf } from './TeamDock.logic';
import type { TeamDockLayout, TeamDockProps, TeamDockWords } from './TeamDock.types';
import { LoadRing } from './TeamDockRing.native';

/**
 * The team under the lead on the phone (`M02-28`): a row of faces that scrolls when it overflows,
 * each ringed by its load against the busiest; a tap gives the lead, no confirm. While the lead's
 * act is out every face waits.
 */
export function TeamDock({
  people,
  readerId,
  layout,
  onGive,
  onAll,
  waiting,
  words,
}: TeamDockProps) {
  const shares = loadSharesOf(people);
  const { shown, overflows } = dockedOf(people, layout);
  const tiles = layout === 'tiles';
  const width = `${100 / dockColumnsOf(shown.length, overflows)}%` as const;
  const faces = (
    <>
      {shown.map((person) => (
        <Face
          key={person.userId}
          person={person}
          share={shares.get(person.userId) ?? 0}
          you={person.userId === readerId}
          layout={layout}
          waiting={waiting}
          onGive={onGive}
          words={words}
          width={tiles ? width : undefined}
        />
      ))}
      {overflows ? (
        <Pressable
          disabled={waiting}
          accessibilityLabel={words.all(people.length)}
          onPress={onAll}
          style={[styles.face, tiles ? [styles.tile, { width }] : undefined]}
        >
          <View style={[styles.ring, styles.allRing]}>
            <ShellGlyph name="people" size="md" tone="primary" />
          </View>
          <Text variant="body-sm" bold style={styles.name}>
            {words.all(people.length)}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
  if (tiles) return <View style={styles.grid}>{faces}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {faces}
    </ScrollView>
  );
}

interface FaceProps {
  person: AssignPickerPerson;
  share: number;
  you: boolean;
  layout: TeamDockLayout;
  waiting: boolean;
  onGive: (userId: string) => void;
  words: TeamDockWords;
  width: `${number}%` | undefined;
}

function Face({ person, share, you, layout, waiting, onGive, words, width }: FaceProps) {
  const late = person.overdueCount > 0;
  const tiles = layout === 'tiles';
  return (
    <Pressable
      disabled={waiting}
      accessibilityLabel={words.giveTo(person.name, person.openCount, person.overdueCount)}
      haptic="impact"
      onPress={() => onGive(person.userId)}
      style={[
        styles.face,
        tiles ? [styles.tile, width === undefined ? undefined : { width }] : undefined,
      ]}
    >
      <View style={styles.ring} importantForAccessibility="no-hide-descendants">
        <LoadRing share={share} late={late} />
        <Avatar name={person.name} size={40} />
      </View>
      <Text variant="body-sm" bold style={styles.name}>
        {you ? words.you : shortNameOf(person.name)}
      </Text>
      <Text variant="caption" style={styles.muted}>
        {words.open(person.openCount)}
      </Text>
      {late || tiles ? (
        <View style={styles.overdue}>
          {late ? <ShellGlyph name="alert-triangle" size="sm" tone="warning" /> : null}
          <Text
            variant="caption"
            color={late ? 'warning' : undefined}
            style={late ? undefined : styles.muted}
          >
            {words.overdue(person.overdueCount)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: theme.spacing['sp-0-5'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing['sp-3'] },
  face: {
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    minWidth: theme.spacing['sp-16'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-tile'],
  },
  tile: { paddingVertical: theme.spacing['sp-4'] },
  ring: {
    width: theme.spacing['sp-12'],
    height: theme.spacing['sp-12'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['sp-1'],
  },
  allRing: {
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-strong'],
  },
  name: { color: colors['on-panel'], textAlign: 'center' },
  muted: { color: colors['on-panel-muted'], textAlign: 'center' },
  overdue: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
});
