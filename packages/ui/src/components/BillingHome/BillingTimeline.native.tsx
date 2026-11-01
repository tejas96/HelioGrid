import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { Timeline } from '../Timeline/Timeline.native';
import type { TimelineItem } from '../Timeline/Timeline.types';
import type { BillingTimelineItem, BillingTimelineProps } from './BillingHome.parts.types';

function timelineItemOf(item: BillingTimelineItem): TimelineItem {
  return {
    id: item.id,
    label: item.label,
    meta: item.meta,
    status: item.status,
    ...(item.description === null ? {} : { description: item.description }),
    ...(item.figure === null
      ? {}
      : {
          content: (
            <Text variant="mono" oneLine>
              {item.figure}
            </Text>
          ),
        }),
  };
}

/**
 * `Payment reminders` and `Plan history` on the phone (decision 13, frames 21 and 22): a sheet
 * holding the compact timeline, newest first, its own loading, failure and empty answer, and
 * `Show more` while more remain.
 */
export function BillingTimeline(props: BillingTimelineProps) {
  const { words } = props;
  return (
    <EditorSurface
      open={props.open}
      onClose={props.onClose}
      closeLabel={words.close}
      showClose
      size="full"
      density="expressive"
      title={words.title}
    >
      <View style={styles.body}>
        <Timeline
          density="expressive"
          variant="compact"
          items={props.items.map(timelineItemOf)}
          emptyTitle={words.nothingYet}
          errorTitle={words.failedTitle}
          retryLabel={words.tryAgain}
          read={props.read}
          loadingLabel={words.loading}
        />
        {props.read.kind === 'ready' && props.more ? (
          <View style={styles.start}>
            <Button variant="secondary" size="md" onClick={props.onShowMore}>
              {words.showMore}
            </Button>
          </View>
        ) : null}
      </View>
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  start: { flexDirection: 'row' },
});
