/* Where one step sits on the rail (native) — its node, and the segment of rail that runs on to the
   next step. Lit as far as the last done-or-current step, dim beyond it; the last step draws no
   segment at all, because a rail that runs past the end says there is more sequence.

   The web half holds these metrics in Timeline.css; here they arrive as numbers from the sequence,
   so the rail reaches exactly across the row gap it has to bridge. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import type { TimelineStatus } from './Timeline.types';
import { TimelineNode } from './TimelineParts.native';

const styles = StyleSheet.create({
  railCell: { position: 'relative', alignItems: 'center' },
  rail: { position: 'absolute', width: 2, borderRadius: 2 },
});

export function TimelineRailCell({
  status,
  compact,
  node,
  gap,
  isLast,
  railLit,
}: {
  status?: TimelineStatus;
  compact: boolean;
  /** The node's diameter — the rail starts where the node ends. */
  node: number;
  /** The sequence's row gap — the rail bridges it, so it must know how wide it is. */
  gap: number;
  isLast: boolean;
  railLit: boolean;
}) {
  return (
    <View style={[styles.railCell, { width: node }]}>
      <TimelineNode status={status} compact={compact} />
      {isLast ? null : (
        <View
          style={[
            styles.rail,
            {
              top: node,
              bottom: compact ? -gap : 0,
              backgroundColor: railLit ? theme.colors.success : theme.colors['canvas-sunken'],
              opacity: railLit ? 0.35 : 1,
            },
          ]}
        />
      )}
    </View>
  );
}
