import type { TranslatedText } from '@heliogrid/contracts';
import type { SearchGroupView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { CardRows } from '../CardRows/CardRows.native';
import { EmptyScene } from '../EmptyScene/EmptyScene.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider/market-context';
import { SearchResultRow } from './SearchResultRow.native';
import type { SearchResultsProps } from './SearchResults.types';

/** The rows a group's wait stands for: a few, never one per result yet unknown. */
const WAITING_ROWS = ['row', 'row', 'row', 'row'] as const;

/**
 * Global Search's results on the phone. One frame holds every state, so the screen reader sent to
 * it after a *Try again* stays while the read is out again; the groups follow the read's order.
 */
export function SearchResults<Failure>(props: SearchResultsProps<Failure>) {
  const { read, words } = props;
  const frame = useRef<View>(null);
  return (
    <View ref={frame} style={styles.results}>
      {read.kind === 'idle' ? <SearchNote {...words.idle} /> : null}
      {read.kind === 'loading' ? <LoadingBars bars={WAITING_ROWS} label={words.loading} /> : null}
      {read.kind === 'empty' ? <SearchNote {...words.none(read.asked)} /> : null}
      {read.kind === 'failed' ? (
        <FailedRead
          title={words.failed.title}
          message={words.failed.body}
          retryLabel={words.failed.retry}
          onRetry={read.retry}
          focusAfter={frame}
        />
      ) : null}
      {read.kind === 'ready'
        ? read.value.groups.map((group) => (
            <SearchResultGroup key={group.group} {...props} group={group} />
          ))
        : null}
    </View>
  );
}

/** Nothing to list yet, or nothing found: what search covers, said quietly where the rows go. */
function SearchNote({ title, body }: { title: TranslatedText; body: TranslatedText }) {
  return (
    <View style={styles.note}>
      <EmptyScene name="search" />
      <View accessibilityRole="header">
        <Text variant="h3" align="center">
          {title}
        </Text>
      </View>
      <Text variant="body" color="secondary" align="center">
        {body}
      </Text>
    </View>
  );
}

function SearchResultGroup<Failure>(
  props: SearchResultsProps<Failure> & { group: SearchGroupView<Failure> },
) {
  const { group, words, onOpen } = props;
  const format = useFormat();
  const count = format.number(group.total);
  const { seeAll } = group;
  return (
    <View style={styles.group}>
      <View style={styles.head}>
        <View accessibilityRole="header">
          <Text variant="overline" color="secondary">
            {words.group(group.group)}
          </Text>
        </View>
        <Text variant="mono" color="secondary" style={styles.count}>
          {count}
        </Text>
        {seeAll === null ? null : (
          <Pressable onPress={() => onOpen(seeAll)} style={styles.seeAll}>
            <Text variant="body-sm" color="accent" bold>
              {words.seeAll(count)}
            </Text>
            <ShellGlyph name="chevron-right" size="sm" tone="accent" />
          </Pressable>
        )}
      </View>
      <CardRows>
        {group.rows.map((row, at) => (
          <SearchResultRow key={row.key} {...props} row={row} first={at === 0} />
        ))}
      </CardRows>
    </View>
  );
}

const styles = StyleSheet.create({
  results: { gap: theme.spacing['sp-5'] },
  group: { gap: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  count: { fontSize: theme.type.roles.caption.fontSize },
  /* `Pressable`'s base centres its target; See all sits at the head's end, its words then its mark. */
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    marginStart: 'auto',
  },
  note: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-12'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
});
