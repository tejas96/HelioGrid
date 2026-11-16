import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';

/** The overflow trigger's three dots. */
export function OverflowGlyph() {
  return <ShellGlyph name="dots" size="sm" ink={colors['text-secondary']} />;
}

/**
 * A destructive item's own glyph. Danger colour is never the only channel — this trash mark is
 * what keeps the meaning alive in greyscale and for a colourblind reader.
 */
export function TrashGlyph({ color }: { color: ThemeColor }) {
  return <ShellGlyph name="trash" size="sm" ink={color} />;
}

/** A destructive row's leading glyph, and nothing at all for an ordinary one. */
export function MenuLeadGlyph({ color, destructive }: { color: ThemeColor; destructive: boolean }) {
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
  return <ShellGlyph name="check" size="dense" ink={colors.accent} />;
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
