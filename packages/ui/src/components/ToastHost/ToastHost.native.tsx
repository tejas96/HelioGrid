import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Portal } from '../../primitives/Portal/Portal.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Toast } from '../Toast/Toast.native';
import type { ToastHostProps, ToastItem, ToastPosition } from './ToastHost.types';

interface NativeToastHostProps extends ToastHostProps {
  style?: StyleProp<ViewStyle>;
}

function DismissGlyph() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6 6 18M6 6l12 12"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Web's three `position: fixed` placements, as RN absolute boxes. */
function placement(position: ToastPosition, offset: number): ViewStyle {
  if (position === 'bottom-right') {
    return {
      bottom: theme.spacing['sp-6'],
      right: theme.spacing['sp-6'],
      alignItems: 'flex-end',
    };
  }
  if (position === 'top-center') {
    return {
      top: theme.spacing['sp-6'],
      left: theme.spacing['sp-4'],
      right: theme.spacing['sp-4'],
      alignItems: 'center',
    };
  }
  return {
    bottom: offset,
    left: theme.spacing['sp-4'],
    right: theme.spacing['sp-4'],
    alignItems: 'center',
  };
}

/**
 * The container Toast needs. Holds the queue, stacks at most `max` at once, auto-dismisses, and
 * pauses the timer while the stack is being touched.
 *
 * TWO WEB BEHAVIOURS MAPPED FOR TOUCH:
 * · `position: fixed` has no RN equivalent, so the stack renders through the Portal primitive —
 *   the one thing in the system that lifts a layer out of its screen.
 * · There is no pointer to hover, so the pause the DS gives `onMouseEnter`/`onMouseLeave` is taken
 *   on touch-down / touch-up: holding the stack holds the timer, which is the same promise.
 */
export function ToastHost({
  toasts = [],
  onDismiss,
  position = 'bottom-center',
  max = 3,
  duration = 4000,
  offset = 96,
  style,
}: NativeToastHostProps) {
  const shown = useMemo(() => toasts.slice(-max), [toasts, max]);
  const [paused, setPaused] = useState(false);
  const oldest: ToastItem | undefined = shown[0];

  useEffect(() => {
    if (paused || onDismiss === undefined || oldest === undefined) {
      return;
    }
    const id = oldest.id;
    const timer = setTimeout(() => onDismiss(id), oldest.duration ?? duration);
    return () => clearTimeout(timer);
  }, [oldest, paused, onDismiss, duration]);

  if (shown.length === 0) {
    return null;
  }

  return (
    <Portal>
      <View
        accessibilityLiveRegion="polite"
        pointerEvents="box-none"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
        style={[styles.host, placement(position, offset), style]}
      >
        {shown.map((toast) => (
          <View key={toast.id} style={styles.item}>
            <Toast
              style={styles.card}
              tone={toast.tone}
              title={toast.title}
              description={toast.description}
              icon={toast.icon}
              action={
                toast.action ??
                (onDismiss === undefined ? undefined : (
                  <Pressable
                    style={styles.dismiss}
                    accessibilityLabel="Dismiss"
                    onPress={() => onDismiss(toast.id)}
                  >
                    <DismissGlyph />
                  </Pressable>
                ))
              }
            />
          </View>
        ))}
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    zIndex: 80,
    flexDirection: 'column',
    gap: theme.spacing['sp-2'],
  },
  item: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    width: '100%',
  },
  /* Pressable already holds the 44px floor; the extra 12px comes back as negative margin so no
     toast grew. -6 has no spacing token — it is the negative half of that correction. */
  dismiss: {
    width: 44,
    height: 44,
    marginTop: -6,
    marginBottom: -6,
    marginRight: -6,
    borderRadius: theme.radius['r-pill'],
  },
});
