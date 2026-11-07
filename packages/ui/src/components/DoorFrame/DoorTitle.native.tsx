import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Explainer } from '../Explainer/Explainer.native';
import type { DoorTitleProps } from './DoorFrame.types';

/** The door's title block: the large title in the display face, its ask on the same row, and the intro under it. */
export function DoorTitle({ overline, title, explainer, intro }: DoorTitleProps) {
  return (
    <View style={styles.block}>
      {overline === undefined ? null : (
        <Text variant="overline" color="secondary">
          {overline}
        </Text>
      )}
      <View style={styles.row}>
        <Text variant="display" style={styles.title}>
          {title}
        </Text>
        {explainer === undefined ? null : <Explainer {...explainer} />}
      </View>
      {intro === undefined ? null : (
        <Text variant="body" color="secondary">
          {intro}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: theme.spacing['sp-2'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The title gives way and wraps, so a long one never pushes its ask off the screen. */
  title: { flexShrink: 1 },
});
