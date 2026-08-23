import { theme } from '@heliogrid/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TooltipPlacement, TooltipProps } from './Tooltip.types';

interface NativeTooltipProps extends TooltipProps {
  style?: StyleProp<ViewStyle>;
}

const PLACEMENT: Record<TooltipPlacement, ViewStyle> = {
  top: { bottom: '100%', marginBottom: theme.spacing['sp-2'], alignSelf: 'center' },
  bottom: { top: '100%', marginTop: theme.spacing['sp-2'], alignSelf: 'center' },
  left: { right: '100%', marginRight: theme.spacing['sp-2'], alignSelf: 'center' },
  right: { left: '100%', marginLeft: theme.spacing['sp-2'], alignSelf: 'center' },
};

/**
 * A near-black label for a control whose meaning isn't obvious.
 *
 * HOVER HAS NO TOUCH EQUIVALENT, so the DS's hover-after-`delay` becomes TOUCH-AND-HOLD for the
 * same `delay`: the bubble appears if the finger is still down when the delay elapses and leaves
 * when it lifts, so an ordinary tap never opens it and the child control keeps its press. The
 * handlers sit on a plain View and bubble from the child, so nothing steals the touch responder.
 * `accessibilityHint` carries the same words to a screen reader, which is the keyboard-focus half
 * of the web behaviour.
 *
 * The DS's rule holds harder here than on web: a touch user may never see this, so nothing that
 * exists nowhere else belongs in it.
 */
export function Tooltip({
  label,
  children,
  placement = 'top',
  delay = 300,
  style,
}: NativeTooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <View
      accessibilityHint={label}
      onTouchStart={show}
      onTouchEnd={hide}
      onTouchCancel={hide}
      style={[styles.anchor, style]}
    >
      {children}
      {open ? (
        <View pointerEvents="none" style={[styles.bubble, PLACEMENT[placement]]}>
          <Text color="inverse" style={bubbleText}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* --fs-caption at --fw-medium, and -0.01em of 12px in points. */
const bubbleText: TextStyle = {
  fontSize: theme.type.roles.caption.fontSize,
  fontWeight: '500',
  letterSpacing: -0.12,
};

const styles = StyleSheet.create({
  anchor: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  /* 6/10 are the bubble's own padding — the spacing scale has no 6px or 10px step. */
  bubble: {
    position: 'absolute',
    zIndex: 70,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius['r-xs'],
    backgroundColor: theme.colors['text-primary'],
    ...theme.elevation.e3,
  },
});
