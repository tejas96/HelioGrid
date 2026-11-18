import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import type { DesignCoverProps } from './DesignCover.types';

/** A design's cover, on the phone. */
export function DesignCover({ word, mark }: DesignCoverProps) {
  const { ground } = useGround();
  return (
    <View style={[styles.cover, mark === undefined ? undefined : styles.marked]}>
      {mark === undefined ? null : (
        /* The mark is backed by the card colour, so it reads over whatever the cover shows. */
        <View style={[styles.mark, { backgroundColor: ground }]}>{mark}</View>
      )}
      <Text variant="body-sm" color="secondary" align="center">
        {word}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.spacing['sp-16'],
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-sm'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    backgroundColor: colors['canvas-sunken'],
    overflow: 'hidden',
  },
  /* The mark lies on the cover's corner, so the words under it start below it. */
  marked: {
    paddingTop: theme.spacing['sp-2'] + theme.layout['badge-h'] + theme.spacing['sp-1'],
  },
  mark: {
    position: 'absolute',
    top: theme.spacing['sp-2'],
    start: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-badge'],
    ...theme.elevation.e1,
  },
});
