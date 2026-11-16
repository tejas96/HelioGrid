/* Timeline's node, skeleton and message (native). Status is never colour alone: each state carries
   its own glyph inside the node, and `upcoming` is an empty disc, which is its own shape. A node
   not yet done takes the control fill, the opposite of what holds it (`F7-15`), never an outline.

   Two web-only things are mapped rather than dropped:
   · the `0 0 0 5px` ring on the current node becomes an absolutely-positioned View behind it, so
     the ring costs no layout, exactly as an outer box-shadow does not;
   · the shimmer keyframe has no RN equivalent, so the loading bars are the same footprint in
     --canvas-sunken. Nothing reflows when the figure lands, which is what the shimmer was for. */

import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { useGround } from '../../primitives/Ground/Ground.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { GLYPH_SIZE } from '../AppShell/ShellGlyph.logic';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { RetryButton } from '../Button/RetryButton.native';
import { StateRegion } from '../StateBody/StateRegion.native';
import { messageGlyphOf, NODE_GLYPH, nodeGlyphSize } from './Timeline.logic';
import type { TimelineStatus } from './Timeline.types';

export const NODE_SIZE = { page: 28, compact: 20 } as const;

const styles = StyleSheet.create({
  nodeWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: theme.radius['r-pill'] },
  node: {
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: { borderRadius: theme.radius['r-pill'], backgroundColor: colors.accent },
  skeleton: { gap: 22 },
  skeletonRow: { flexDirection: 'row', columnGap: theme.spacing['sp-4'] },
  skeletonNode: {
    width: 28,
    height: 28,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
  skeletonLines: { flex: 1, gap: theme.spacing['sp-2'] },
  skeletonBar: {
    borderRadius: theme.radius['r-sm'],
    backgroundColor: colors['canvas-sunken'],
  },
});

/* Current and upcoming take the control fill, read from `Ground` where the node renders. */
const NODE_FILL: Record<TimelineStatus, ThemeColor | undefined> = {
  done: colors.success,
  /* A warning MARK takes --warning-text; --warning itself clears no contrast floor. */
  blocked: TONE.warning.ink,
  failed: colors.danger,
  current: undefined,
  upcoming: undefined,
  skipped: colors['canvas-sunken'],
};

export function TimelineNode({
  status = 'upcoming',
  compact,
  icon,
}: {
  status?: TimelineStatus;
  compact: boolean;
  /** The current step's own glyph, in place of its dot. */
  icon?: ReactNode;
}) {
  const own = status === 'current' && icon !== undefined;
  const size = compact ? NODE_SIZE.compact : NODE_SIZE.page;
  const inner = nodeGlyphSize(compact);
  const mark = status === undefined ? undefined : NODE_GLYPH[status];
  const ring = compact ? 4 : 5;
  const tick = colors['text-inverse'];
  const { controlFill } = useGround();
  return (
    <View style={[styles.nodeWrap, { width: size, height: size }]}>
      {status === 'current' ? (
        <View
          style={[
            styles.ring,
            {
              width: size + ring * 2,
              height: size + ring * 2,
              backgroundColor: colors['accent-subtle'],
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.node,
          { width: size, height: size, backgroundColor: NODE_FILL[status] ?? controlFill },
          own ? { backgroundColor: colors.accent } : undefined,
        ]}
      >
        {own ? icon : null}
        {mark === undefined ? null : (
          <ShellGlyph
            name={mark}
            size={inner}
            ink={status === 'skipped' ? colors['text-secondary'] : tick}
          />
        )}
        {status === 'current' && !own ? (
          <View
            style={[styles.core, { width: GLYPH_SIZE[inner] - 2, height: GLYPH_SIZE[inner] - 2 }]}
          />
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
export function TimelineSkeleton({ label }: { label?: TranslatedText }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
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
  retryLabel,
  focusAfter,
}: {
  tone?: 'warning';
  title?: TranslatedText;
  message?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  focusAfter: FocusAfter;
}) {
  return (
    <StateRegion
      tone={tone}
      glyph={messageGlyphOf(tone)}
      title={title}
      message={message}
      action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
    />
  );
}
