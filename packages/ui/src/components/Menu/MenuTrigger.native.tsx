import { theme } from '@heliogrid/theme';
import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { OverflowGlyph } from './MenuGlyphs.native';

/** What the wrapper hands a caller-supplied trigger. Its own handler still runs first. */
type TriggerElement = ReactElement<{ disabled?: boolean; onPress?: () => void }>;

interface MenuTriggerProps {
  disabled: boolean;
  /** The menu's accessible name — also the default trigger's `accessibilityLabel`. */
  label: string;
  onToggle: () => void;
  open: boolean;
  trigger?: ReactElement;
}

/**
 * The trigger, in its own file the way the web half keeps it — so the one thing this control has to
 * announce is declared once per platform, in the same place.
 *
 * The web half also owns focus restore and the ArrowDown-to-open key; neither has a touch
 * counterpart, so the two acts here are tap-to-open and tap-to-close.
 */
export function MenuTrigger({ disabled, label, onToggle, open, trigger }: MenuTriggerProps) {
  if (trigger !== undefined) {
    return cloneElement(trigger as TriggerElement, {
      disabled,
      onPress: () => {
        (trigger as TriggerElement).props.onPress?.();
        onToggle();
      },
    });
  }

  return (
    <Pressable
      accessibilityLabel={label}
      /* THE MENU IS OPEN OR IT IS NOT, and the trigger says which — the web half's
         `aria-expanded={open}`. Without it the only channel is the tinted overflow dot (F7-12). */
      accessibilityState={{ expanded: open }}
      disabled={disabled}
      onPress={onToggle}
      style={[styles.overflow, open ? styles.overflowOpen : undefined]}
    >
      <OverflowGlyph />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overflow: {
    width: 44,
    height: 44,
    borderRadius: theme.radius['r-pill'],
  },
  overflowOpen: { backgroundColor: theme.colors['neutral-bg'] },
});
