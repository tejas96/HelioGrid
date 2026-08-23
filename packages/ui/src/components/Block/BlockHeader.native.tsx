import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { BlockProps } from './Block.types';

const type = theme.type.roles;

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    minWidth: 0,
  },
  main: { flexShrink: 1, minWidth: 0 },
  overline: {
    fontFamily: theme.type.families.sans,
    fontSize: type.overline.fontSize,
    fontWeight: '700',
    letterSpacing: type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.colors['text-tertiary'],
  },
  overlineSpaced: { marginBottom: 6 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    letterSpacing: -0.24,
    color: theme.colors['text-primary'],
  },
  count: {
    height: 20,
    paddingHorizontal: 7,
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['neutral-bg'],
  },
  countText: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    fontWeight: '500',
    color: theme.colors['neutral-text'],
  },
  meta: {
    marginTop: 3,
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    lineHeight: 17.4,
    color: theme.colors['text-tertiary'],
  },
  action: { flexShrink: 0 },
});

/** A TOTAL beside a heading, not an unread badge — grouped, tabular, and never clamped by default. */
function BlockCount({ shownCount, countLabel }: { shownCount: string; countLabel?: string }) {
  /* The web half hides the bare numeral from the reader and exposes "6 sites" as text instead, so
     the sentence belongs on the numeral itself — a `Text`, which already IS an accessibility
     element. On the wrapper it was announced nowhere. */
  return (
    <View style={styles.count}>
      <Text
        accessibilityLabel={countLabel !== undefined ? `${shownCount} ${countLabel}` : shownCount}
        style={styles.countText}
      >
        {shownCount}
      </Text>
    </View>
  );
}

export interface BlockHeaderProps
  extends Pick<
    BlockProps,
    'overline' | 'title' | 'meta' | 'action' | 'badge' | 'countLabel' | 'density'
  > {
  /** The grouped numeral, already clamped and formatted; `null` draws nothing. */
  shownCount: string | null;
}

/**
 * The header row draws for a title, a count OR a badge — the heading is the optional part, so an
 * overline-only block (`overline="AGENT CALLS"`, `count={6}`) still shows the numeral.
 */
export function BlockHeader({
  overline,
  title,
  meta,
  action,
  badge,
  countLabel,
  density,
  shownCount,
}: BlockHeaderProps): ReactNode {
  const titleRow = title !== undefined || shownCount !== null || badge !== undefined;
  if (overline === undefined && !titleRow && meta === undefined && action === undefined) {
    return null;
  }
  const titleType: TextStyle = { fontSize: density === 'functional' ? 15 : 16 };
  return (
    <View style={styles.head}>
      <View style={styles.main}>
        {overline !== undefined ? (
          <Text style={[styles.overline, titleRow ? styles.overlineSpaced : null]}>{overline}</Text>
        ) : null}
        {titleRow ? (
          <View style={styles.titleRow}>
            {title !== undefined ? (
              <Text accessibilityRole="header" style={[styles.title, titleType]}>
                {title}
              </Text>
            ) : null}
            {shownCount !== null ? (
              <BlockCount shownCount={shownCount} countLabel={countLabel} />
            ) : null}
            {badge}
          </View>
        ) : null}
        {/* M08-16: the object this block reads, and the version in force. */}
        {meta !== undefined ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {action !== undefined ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}
