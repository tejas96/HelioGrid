/* One step of the sequence (native) — its place on the rail, and what it says: the label and its
   meta, the description, who did it, and any node the caller hung under it. Same split as the web
   half; the metrics the web half keeps in Timeline.css arrive here as numbers from the sequence. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { TimelineItem, TimelineStatus } from './Timeline.types';
import { TimelineRailCell } from './TimelineRailCell.native';

const styles = StyleSheet.create({
  step: { flexDirection: 'row', minWidth: 0 },
  body: { flex: 1, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: theme.spacing['sp-3'],
  },
  labelPage: { fontSize: theme.type.roles['card-head'].fontSize },
  labelCurrent: { fontWeight: '700', letterSpacing: theme.type.roles.h4.letterSpacing },
  description: { marginTop: theme.spacing['sp-1'], maxWidth: 560 },
  actor: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: { marginTop: 10 },
  descriptionRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  /* What the system did: the teal ink — the words say it, the ink is a second channel. */
  descriptionSystem: { flexShrink: 1, color: colors['hue-teal-text'] },
});

/** Upcoming reads quiet; a step gone past reads secondary; the rest read primary. */
function labelColorOf(status: TimelineStatus): 'tertiary' | 'secondary' | 'primary' {
  if (status === 'upcoming') return 'tertiary';
  return status === 'skipped' ? 'secondary' : 'primary';
}

export function TimelineStep({
  item,
  compact,
  node,
  gap,
  pad,
  isLast,
  railLit,
}: {
  item: TimelineItem;
  compact: boolean;
  /** The node's diameter, which the head's minimum height matches in the compact form. */
  node: number;
  /** The sequence's row gap, which the rail has to bridge. */
  gap: number;
  /** The breathing room under a step's body — the density's own measure. */
  pad: number;
  isLast: boolean;
  railLit: boolean;
}) {
  const status = item.status ?? 'upcoming';
  const system = item.descriptionTone === 'system';
  return (
    <View
      accessibilityRole="text"
      style={[styles.step, { columnGap: compact ? theme.spacing['sp-3'] : theme.spacing['sp-4'] }]}
    >
      <TimelineRailCell
        status={item.status}
        compact={compact}
        node={node}
        gap={gap}
        isLast={isLast}
        railLit={railLit}
        icon={item.icon}
      />
      <View style={[styles.body, { paddingBottom: isLast ? 0 : pad }]}>
        <View style={[styles.head, { minHeight: compact ? node : 24 }]}>
          <Text
            variant={compact ? 'body' : 'body-lg'}
            color={labelColorOf(status)}
            style={[
              compact ? null : styles.labelPage,
              item.status === 'current' ? styles.labelCurrent : null,
            ]}
          >
            {item.label}
          </Text>
          {item.meta ? (
            <Text variant="caption" color="tertiary">
              {item.meta}
            </Text>
          ) : null}
        </View>
        {item.description ? (
          <View style={[styles.description, styles.descriptionRow]}>
            {system ? <ShellGlyph name="spark" size="dense" ink={colors['hue-teal-text']} /> : null}
            <Text
              variant="body-sm"
              color="secondary"
              style={system ? styles.descriptionSystem : undefined}
            >
              {item.description}
            </Text>
          </View>
        ) : null}
        {item.actor ? (
          <View style={styles.actor}>
            <ShellGlyph name="user" size="dense" ink={colors['text-tertiary']} />
            <Text variant="caption" color="tertiary">
              {item.actor}
            </Text>
          </View>
        ) : null}
        {item.content ? <View style={styles.content}>{item.content}</View> : null}
      </View>
    </View>
  );
}
