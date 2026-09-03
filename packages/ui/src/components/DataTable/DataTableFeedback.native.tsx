import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

/* DataTable — the loading skeleton, the blocked-state message and the row's own line. Split out
   of DataTableChrome.native.tsx so no file runs past 300 lines. */

const styles = StyleSheet.create({
  note: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  noteText: { flexShrink: 1 },
  noteAction: { marginLeft: 'auto' },
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 56,
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
  retry: {
    marginTop: 10,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  skeletonStack: { padding: theme.spacing['sp-2'] },
  skeletonHead: { height: MIN_TOUCH_TARGET, backgroundColor: theme.colors.canvas },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-5'] },
  /* The phone's loading shape: one 76px card per record, matching the cards it becomes. */
  skeletonCard: {
    height: 76,
    padding: theme.spacing['sp-4'],
    marginBottom: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['surface-alt'],
  },
  skeletonZebra: { backgroundColor: theme.colors['surface-alt'] },
  skeletonPlain: { backgroundColor: theme.colors.surface },
  bar: {
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});

/**
 * **The table loads in the shape it will take.** The wide form draws a header bar over `rowH`-tall
 * zebra rows; the stacked form draws the 76px cards it becomes. A single card skeleton under a
 * table that resolves wide is a reflow the reader has to re-read — `F7-31`'s rule reaching the
 * loading state, and the same branch the web half takes.
 */
export function TableSkeleton({
  stacked,
  rowH = 64,
  edge = theme.spacing['sp-6'],
}: {
  stacked: boolean;
  /** The density's row height — the wide form's rows are the height the real ones will be. */
  rowH?: number;
  edge?: number;
}) {
  const wideRow = { height: rowH, paddingHorizontal: edge };
  return (
    /* Web's skeleton is `role="status"`. RN has no `status`, and `progressbar` would report a
       position five blank rows have none of — the table does not know how many records are coming.
       `accessible` is safe here and only here in this file: the skeleton has no row tick, no live
       cell and no row action, so folding it puts no 44dp control out of reach. */
    <View
      accessible
      accessibilityLabel="Loading records"
      accessibilityLiveRegion="polite"
      style={stacked ? styles.skeletonStack : null}
    >
      {stacked ? null : <View style={styles.skeletonHead} />}
      {['a', 'b', 'c', 'd', 'e'].map((row, index) => (
        <View
          key={row}
          style={[
            styles.skeletonRow,
            stacked ? styles.skeletonCard : wideRow,
            stacked || index % 2 === 1 ? styles.skeletonZebra : styles.skeletonPlain,
          ]}
        >
          <View style={[styles.bar, { width: '28%' }]} />
          <View style={[styles.bar, { width: '18%' }]} />
          <View style={{ flex: 1 }} />
          <View style={[styles.bar, { width: '14%' }]} />
        </View>
      ))}
    </View>
  );
}

/** The centred body of a blocked surface. `warning` is the error form and carries the retry. */
export function TableMessage({
  tone,
  title,
  message,
  onRetry,
  action,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  action?: ReactNode;
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
            <Path
              d="M3 6h18M3 12h18M3 18h10"
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )}
        </Svg>
      </View>
      <Text variant="h4" align="center">
        {title}
      </Text>
      {message === undefined ? null : (
        <Text variant="body-sm" color="secondary" align="center" style={{ maxWidth: 320 }}>
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
      {action}
    </View>
  );
}

/** The row's own line: what is wrong, in words, under the cells it is about. */
export function RowNote({
  issue,
  fixed,
  action,
}: {
  issue: string | null;
  fixed: boolean | string | null;
  action: ReactNode;
}) {
  const warn = issue !== null;
  const text = warn ? issue : typeof fixed === 'string' ? fixed : 'Fixed.';
  const stroke = warn ? theme.colors['warning-text'] : theme.colors['success-text'];
  return (
    <View style={styles.note}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        {warn ? (
          <>
            <Path d="M12 9v4M12 17h.01" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
            <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={1.5} />
          </>
        ) : (
          <Path
            d="m5 13 4 4L19 7"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
      <Text variant="body-sm" color={warn ? 'warning' : 'success'} style={styles.noteText}>
        {text}
      </Text>
      {action === undefined || action === null ? null : (
        <View style={styles.noteAction}>{action}</View>
      )}
    </View>
  );
}
