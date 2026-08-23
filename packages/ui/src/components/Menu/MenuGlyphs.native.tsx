import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** The overflow trigger's three dots. */
export function OverflowGlyph() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.6} fill={theme.colors['text-secondary']} />
      <Circle cx={12} cy={12} r={1.6} fill={theme.colors['text-secondary']} />
      <Circle cx={19} cy={12} r={1.6} fill={theme.colors['text-secondary']} />
    </Svg>
  );
}

/**
 * A destructive item's own glyph. Danger colour is never the only channel — this trash mark is
 * what keeps the meaning alive in greyscale and for a colourblind reader.
 */
export function TrashGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A destructive row's leading glyph, and nothing at all for an ordinary one. */
export function MenuLeadGlyph({ color, destructive }: { color: string; destructive: boolean }) {
  return destructive ? <TrashGlyph color={color} /> : null;
}

/**
 * The tick column, RESERVED on every switcher row — current or not — so the labels do not shift by
 * 22dp when the current option moves.
 */
export function MenuTick({ checked, twoLine }: { checked: boolean; twoLine: boolean }) {
  return (
    <View style={[styles.tick, twoLine ? styles.tickWithReason : undefined]}>
      {checked ? <TickGlyph /> : null}
    </View>
  );
}

/** The switcher's tick — `selection="single"`'s non-colour channel beside the checked state. */
export function TickGlyph() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="m5 13 4 4L19 7"
        stroke={theme.colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  tick: {
    width: 16,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickWithReason: { marginTop: 3 },
});
