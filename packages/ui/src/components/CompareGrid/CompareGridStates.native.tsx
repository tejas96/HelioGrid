import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

const styles = StyleSheet.create({
  skeleton: { padding: theme.spacing['sp-4'], gap: theme.spacing['sp-3'] },
  bar: {
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  lead: { width: '60%', height: theme.spacing['sp-4'] },
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 48,
    paddingHorizontal: theme.spacing['sp-6'],
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['sp-1'],
    backgroundColor: theme.colors['neutral-bg'],
  },
  markWarning: { backgroundColor: theme.colors['warning-bg'] },
  body: { maxWidth: 340 },
  retry: {
    marginTop: 10,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
});

/**
 * The loading form. Never a placeholder value presented as a real one, the role included: web says
 * `role="status"`, and six featureless bars have no position for `progressbar` to report. RN's
 * counterpart is an accessibility element — the bars are decoration, so `accessible` folds nothing
 * a reader could otherwise reach — announced politely.
 */
export function CompareSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading the comparison"
      accessibilityLiveRegion="polite"
      style={styles.skeleton}
    >
      {['title', 'a', 'b', 'c', 'd', 'e'].map((row) => (
        <View key={row} style={[styles.bar, row === 'title' ? styles.lead : null]} />
      ))}
    </View>
  );
}

/**
 * The centred body of a blocked surface. `tone="warning"` is the **error** form and carries the
 * retry; the neutral form serves both `empty` ("none yet") and `unavailable` ("this was never
 * going to be here"), and `unavailable` never gets a retry.
 */
export function CompareMessage({
  tone,
  title,
  message,
  onRetry,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
}) {
  const stroke = tone === 'warning' ? theme.colors['warning-text'] : theme.colors['text-tertiary'];
  return (
    <View style={styles.message}>
      <View style={[styles.mark, tone === 'warning' ? styles.markWarning : null]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          {tone === 'warning' ? (
            <>
              <Path d="M12 9v4M12 17h.01" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
              <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={1.5} />
            </>
          ) : (
            <>
              <Rect x={3} y={4} width={7} height={16} rx={1.5} stroke={stroke} strokeWidth={1.5} />
              <Rect x={14} y={4} width={7} height={16} rx={1.5} stroke={stroke} strokeWidth={1.5} />
            </>
          )}
        </Svg>
      </View>
      <Text variant="h4" align="center">
        {title}
      </Text>
      {message === undefined ? null : (
        <Text variant="body-sm" color="secondary" align="center" style={styles.body}>
          {message}
        </Text>
      )}
      {onRetry === undefined ? null : (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text variant="body" style={{ fontWeight: '500' }}>
            Try again
          </Text>
        </Pressable>
      )}
    </View>
  );
}
