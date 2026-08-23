/* SourceDocument's chrome (native): paging/fit controls, the state panel, and the plain button
   that opens the real file.

   The fit controls (fit width / fit whole page) say which one is in force, and they say it through
   the primitive: `accessibilityState.selected` is `accessibilityState.selected` here and
   `aria-pressed` on the web half, one declaration for both, with the 44px floor coming from the
   primitive rather than a second copy of the number. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

const styles = StyleSheet.create({
  chrome: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-0-5'] },
  iconBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
  iconBtnPressed: { backgroundColor: theme.colors['accent-subtle'] },
  plain: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  plainWord: { fontWeight: '500' },
  message: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-6'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  messageWarning: { backgroundColor: theme.colors['warning-bg'] },
  mark: {
    width: 44,
    height: 44,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  messageTitle: { fontWeight: '700', letterSpacing: theme.type.roles.h4.letterSpacing },
  messageBody: { maxWidth: 300 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
  },
});

/**
 * Hand the file to the OS — the native partner of the web half's `<a href target="_blank">`. It is
 * the same act (open the real file), never app navigation, and the caller's own handler fires
 * alongside it exactly as the anchor's `onClick` does.
 */
export function openOriginalFile(originalUrl?: string, onOpenOriginal?: () => void): () => void {
  return () => {
    onOpenOriginal?.();
    if (originalUrl) {
      void Linking.openURL(originalUrl).catch(() => undefined);
    }
  };
}

export function Chrome({ children }: { children: ReactNode }) {
  return <View style={styles.chrome}>{children}</View>;
}

export function IconBtn({
  label,
  path,
  onPress,
  disabled,
  pressed,
}: {
  label: string;
  path: string;
  onPress: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  const colour = disabled
    ? theme.colors['text-disabled']
    : pressed
      ? theme.colors.accent
      : theme.colors['text-secondary'];
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(pressed) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d={path}
          stroke={colour}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

export function PlainButton({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.plain}>
      <Text variant="body-sm" style={styles.plainWord}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Message({
  tone,
  title,
  message,
  action,
}: {
  tone?: 'warning';
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  const warning = tone === 'warning';
  const mark = warning ? theme.colors['warning-text'] : theme.colors['text-tertiary'];
  return (
    <View style={[styles.message, warning ? styles.messageWarning : null]}>
      <View style={styles.mark}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          {warning ? <Circle cx={12} cy={12} r={9} stroke={mark} strokeWidth={1.5} /> : null}
          <Path
            d={
              warning
                ? 'M12 8v4M12 16h.01'
                : 'M14 3v5h5M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z'
            }
            stroke={mark}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text variant="body-sm" align="center" style={styles.messageTitle}>
        {title}
      </Text>
      {/* --text-tertiary is under the 4.5 floor on --canvas-sunken, so the words take secondary. */}
      {message ? (
        <Text
          variant="caption"
          color={warning ? 'warning' : 'secondary'}
          align="center"
          style={styles.messageBody}
        >
          {message}
        </Text>
      ) : null}
      {action ? <View style={styles.actions}>{action}</View> : null}
    </View>
  );
}
