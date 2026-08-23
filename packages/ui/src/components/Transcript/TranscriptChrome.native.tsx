/* Transcript's small shared furniture (native) — the globe glyph on the language line and on the
   in-flow switch marker, the plain pill button that the error state and the reveal control both
   press, and the rhythm they all sit on. One declaration each, so they never drift apart. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

const styles = StyleSheet.create({
  plain: {
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  plainWord: { fontWeight: '500' },
});

/** The rhythm between turns — and between the skeleton bars that hold their footprint. */
export const TRANSCRIPT_GAP = { expressive: 10, functional: theme.spacing['sp-2'] };

/** The mark beside the language words. A second channel beside them, never the carrier. */
export function GlobeGlyph({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={theme.colors['text-tertiary']} strokeWidth={1.5} />
      <Path
        d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** "Try again" and "Show the rest of the call" are the same target: a real 44dp plain pill. */
export function TranscriptPlainButton({
  disabled,
  onPress,
  children,
}: {
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={styles.plain}>
      <Text variant="body-sm" style={styles.plainWord}>
        {children}
      </Text>
    </Pressable>
  );
}
