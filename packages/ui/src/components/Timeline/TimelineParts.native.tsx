/* Timeline's node, skeleton and message (native). Status is never colour alone: each state carries
   its own glyph inside the node, and `upcoming` is hollow, which is its own shape.

   Two web-only things are mapped rather than dropped:
   · the `0 0 0 5px` ring on the current node becomes an absolutely-positioned View behind it, so
     the ring costs no layout, exactly as an outer box-shadow does not;
   · the shimmer keyframe has no RN equivalent, so the loading bars are the same footprint in
     --canvas-sunken. Nothing reflows when the figure lands, which is what the shimmer was for. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { TimelineStatus } from './Timeline.types';

export const NODE_SIZE = { page: 28, compact: 20 } as const;

const styles = StyleSheet.create({
  nodeWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: theme.radius['r-pill'] },
  node: {
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  hollow: { borderWidth: 2, borderColor: theme.colors['canvas-sunken'] },
  core: { borderRadius: theme.radius['r-pill'], backgroundColor: theme.colors.accent },
  skeleton: { gap: 22 },
  skeletonRow: { flexDirection: 'row', columnGap: theme.spacing['sp-4'] },
  skeletonNode: {
    width: 28,
    height: 28,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  skeletonLines: { flex: 1, gap: theme.spacing['sp-2'] },
  skeletonBar: {
    borderRadius: theme.radius['r-sm'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-10'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  messageMark: {
    width: 48,
    height: 48,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['sp-1'],
  },
  messageTitle: { fontWeight: '700', letterSpacing: theme.type.roles.h4.letterSpacing },
  messageBody: { maxWidth: 300 },
  retry: {
    marginTop: 10,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
  },
  retryWord: { fontWeight: '500' },
});

const NODE_FILL: Record<TimelineStatus, string | undefined> = {
  done: theme.colors.success,
  /* A warning MARK takes --warning-text; --warning itself clears no contrast floor. */
  blocked: theme.colors['warning-text'],
  failed: theme.colors.danger,
  current: theme.colors.surface,
  upcoming: theme.colors.surface,
};

export function TimelineNode({
  status = 'upcoming',
  compact,
}: {
  status?: TimelineStatus;
  compact: boolean;
}) {
  const size = compact ? NODE_SIZE.compact : NODE_SIZE.page;
  const inner = compact ? 11 : 15;
  const ring = compact ? 4 : 5;
  const tick = theme.colors['text-inverse'];
  return (
    <View style={[styles.nodeWrap, { width: size, height: size }]}>
      {status === 'current' ? (
        <View
          style={[
            styles.ring,
            {
              width: size + ring * 2,
              height: size + ring * 2,
              backgroundColor: theme.colors['accent-subtle'],
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.node,
          { width: size, height: size, backgroundColor: NODE_FILL[status] },
          status === 'upcoming' ? styles.hollow : null,
        ]}
      >
        {status === 'done' ? (
          <Svg width={inner} height={inner} viewBox="0 0 12 12" fill="none">
            <Path
              d="M2.5 6.5 5 9l4.5-5"
              stroke={tick}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
        {status === 'current' ? (
          <View style={[styles.core, { width: inner - 2, height: inner - 2 }]} />
        ) : null}
        {status === 'blocked' ? (
          <Svg width={inner} height={inner} viewBox="0 0 12 12" fill="none">
            <Path d="M6 3v3.5M6 9h.01" stroke={tick} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        ) : null}
        {status === 'failed' ? (
          <Svg width={inner} height={inner} viewBox="0 0 12 12" fill="none">
            <Path
              d="M3.5 3.5l5 5M8.5 3.5l-5 5"
              stroke={tick}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Web is `role="status"`. RN has no `status`, and `progressbar` would report a position four
 * node-and-line rows do not carry, so the node is made an accessibility element instead — every
 * child here is a coloured block, so `accessible` folds no reachable control — and announced
 * politely, which is the same fact web's status region states.
 */
export function TimelineSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading activity"
      accessibilityLiveRegion="polite"
      style={styles.skeleton}
    >
      {['a', 'b', 'c', 'd'].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          <View style={styles.skeletonNode} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonBar, { width: '46%', height: 14 }]} />
            <View style={[styles.skeletonBar, { width: '70%', height: 11 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function TimelineMessage({
  tone,
  title,
  message,
  onRetry,
}: {
  tone?: 'warning';
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  const warning = tone === 'warning';
  return (
    <View style={styles.message}>
      <View
        style={[
          styles.messageMark,
          {
            backgroundColor: warning ? theme.colors['warning-bg'] : theme.colors['neutral-bg'],
          },
        ]}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle
            cx={12}
            cy={12}
            r={9}
            stroke={warning ? theme.colors['warning-text'] : theme.colors['text-tertiary']}
            strokeWidth={1.5}
          />
          <Path
            d={warning ? 'M12 9v4M12 17h.01' : 'M12 7v5l3 2'}
            stroke={warning ? theme.colors['warning-text'] : theme.colors['text-tertiary']}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text variant="body-lg" align="center" style={styles.messageTitle}>
        {title}
      </Text>
      {message ? (
        <Text variant="body-sm" color="secondary" align="center" style={styles.messageBody}>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text variant="body" style={styles.retryWord}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
