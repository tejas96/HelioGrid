import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { bandsShown, isClear } from './MyDay.logic';
import type { MyDayProps } from './MyDay.types';
import { MyDayBand } from './MyDayBand.native';
import { NextUp } from './NextUp.native';

/**
 * My Day on the phone (`SCR-M07-01`, sample B): the next task as the hero, then overdue, today and
 * this week, one column, each block rising once after the one before. The screen's scroll view
 * holds it.
 */
export function MyDay(props: MyDayProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  const day = read.value;
  if (isClear(props)) {
    return <EmptyState scene="settle" title={words.emptyTitle} description={words.emptyBody} />;
  }
  const { overdue, later } = bandsShown(props.bands);
  const hasHero = props.next !== null || props.asking !== null;
  const first = hasHero ? 1 : 0;
  return (
    <View style={styles.page}>
      {hasHero ? (
        <Rising order={0}>
          <NextUp {...props} day={day} />
        </Rising>
      ) : null}
      {props.failed ? (
        <View style={styles.failed} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <ShellGlyph name="alert-circle" size="sm" tone="danger" />
          <View style={styles.failedWords}>
            <Text variant="body-sm" color="danger">
              {words.actFailed}
            </Text>
          </View>
        </View>
      ) : null}
      {[...overdue, ...later].map((band, index) => (
        <Rising key={band.band} order={first + index}>
          <MyDayBand {...props} day={day} band={band} />
        </Rising>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  failed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  failedWords: { flex: 1, minWidth: 0 },
});
