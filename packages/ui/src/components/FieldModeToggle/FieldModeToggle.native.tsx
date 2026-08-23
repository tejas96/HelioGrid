import { theme } from '@heliogrid/theme';
import { useSyncExternalStore } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { FieldModeHook, FieldModeToggleProps } from './FieldModeToggle.types';
import {
  getFieldMode,
  getServerFieldMode,
  setFieldMode,
  subscribeFieldMode,
} from './field-mode-store.native';

/** Reads and sets the mode, from the one shared store — no per-caller copy to go stale. */
export function useFieldMode(): FieldModeHook {
  const on = useSyncExternalStore(subscribeFieldMode, getFieldMode, getServerFieldMode);
  return [on, setFieldMode];
}

export { setFieldMode };

interface NativeFieldModeToggleProps extends FieldModeToggleProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  column: { gap: theme.spacing['sp-1'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'], minHeight: 44 },
  track: {
    width: 52,
    height: theme.spacing['sp-8'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: theme.colors.accent },
  thumb: {
    position: 'absolute',
    top: theme.spacing['sp-1'],
    left: theme.spacing['sp-1'],
    width: theme.spacing['sp-6'],
    height: theme.spacing['sp-6'],
    borderRadius: theme.spacing['sp-3'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  thumbOn: { left: theme.spacing['sp-6'] },
  hint: { paddingLeft: theme.spacing['sp-0-5'] },
});

/**
 * The same switch and the same one store. Two platform notes:
 *
 *  · There is no `<html>` attribute and no token layer on native, so flipping the mode holds the
 *    state and does not yet re-tint the tree — `theme.fieldMode.on` is what a theme provider would
 *    swap in. The web half's `--control-edge` on the track has no counterpart for the same reason.
 *  · There is no persistence: `@heliogrid/ui` takes no storage dependency, so the mode is
 *    per-session here where the web half persists it.
 */
export function FieldModeToggle({
  label = 'High-contrast field mode',
  hint = 'Darker text, and a visible edge on every card, row, field and control. For reading the screen in direct sunlight.',
  style,
}: NativeFieldModeToggleProps) {
  const [on, setOn] = useFieldMode();
  return (
    <View style={[styles.column, style]}>
      <Pressable
        accessibilityLabel={label}
        /* THE SWITCH THAT TURNS HIGH CONTRAST ON MUST NOT BE THE ONE WHOSE STATE IS A TINT.
           The web half is `role="switch" aria-checked={on}`; here the only sighted channel is the
           track colour and the thumb's position, so `switch` + `checked` carry it in words. */
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        onPress={() => setOn(!on)}
        style={styles.row}
      >
        <View style={[styles.track, on ? styles.trackOn : undefined]}>
          <View style={[styles.thumb, on ? styles.thumbOn : undefined]} />
        </View>
        <Text>{label}</Text>
      </Pressable>
      {hint === undefined ? null : (
        <View style={styles.hint}>
          <Text variant="caption" color="tertiary">
            {hint}
          </Text>
        </View>
      )}
    </View>
  );
}

FieldModeToggle.useFieldMode = useFieldMode;
/** Set it without the switch — a settings screen, a deep link, a QA harness. */
FieldModeToggle.set = setFieldMode;
