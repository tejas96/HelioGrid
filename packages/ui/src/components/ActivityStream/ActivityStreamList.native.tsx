import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { streamWindowOf } from './ActivityStream.logic';
import type { ActivityStreamListProps } from './ActivityStream.types';
import { StreamEntry } from './ActivityStreamEntry.native';

const type = theme.type.roles;

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  count: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    color: theme.colors['text-tertiary'],
  },
  /* The web half sticks the day heading; RN has no sticky outside a list host, so the heading
     scrolls with its group and the screen's own list owns any stickiness. */
  day: {
    paddingTop: 6,
    paddingBottom: 10,
    fontFamily: theme.type.families.sans,
    fontSize: type.overline.fontSize,
    fontWeight: '700',
    letterSpacing: type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.colors['text-secondary'],
  },
  more: { flexDirection: 'row', justifyContent: 'center' },
});

/**
 * The window, the day grouping and the count line. Nothing is virtualised: a windowed list keeps
 * the tree small without lying about how many entries exist, and the count states the whole.
 */
export function ActivityStreamList(props: ActivityStreamListProps) {
  const { reveal, format, kinds, step, loadingMore, words, density, onLoadMore, toolbar } = props;
  const view = streamWindowOf(props);

  return (
    <>
      {view.showsToolbar ? (
        <View style={styles.toolbar}>
          {/* The count always states the whole, so a window never reads as the total. */}
          <Text style={styles.count}>{view.countLine}</Text>
          {toolbar}
        </View>
      ) : null}

      <View>
        {view.groups.map((group) => (
          <Fragment key={group.key}>
            {group.heading === null ? null : <Text style={styles.day}>{group.heading}</Text>}
            {group.items.map((entry, index) => (
              <StreamEntry
                key={entry.id ?? `${group.key}-${index}`}
                entry={entry}
                kinds={kinds}
                words={words}
                density={density}
                format={format}
              />
            ))}
          </Fragment>
        ))}
      </View>

      {view.showsMore ? (
        <View style={styles.more}>
          <Button
            variant="secondary"
            size="md"
            disabled={loadingMore}
            onClick={() => (view.revealsLocally ? reveal(step) : onLoadMore?.())}
          >
            {view.moreLabel}
          </Button>
        </View>
      ) : null}
    </>
  );
}
