import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { figure } from '../BillingHome/BillingHome.values';
import { BillingValueText } from '../BillingStrip/BillingValue.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { ListRow } from '../ListRow/ListRow.native';
import { Provenance } from '../Provenance/Provenance.native';
import type { UsageLedgerView, UsagePageWords } from './UsagePage.types';

/**
 * One meter's events at 375 (decision 13, frames c–c3): a full-height sheet whose subtitle is the
 * meter's own figure, `Events this cycle` with its source, one functional row per event, and
 * `Show more` while a next page waits. The sheet's own motion is the only motion; `view` stays
 * the last one shown while it closes, so the sheet never empties as it leaves.
 */
export function UsageLedger({
  open,
  view,
  words,
  onClose,
  onMore,
}: {
  open: boolean;
  view: UsageLedgerView | null;
  words: UsagePageWords;
  onClose: () => void;
  onMore: () => void;
}) {
  if (view === null) return null;
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      showClose
      size="full"
      density="expressive"
      title={view.title}
      subtitle={view.subtitle}
      read={view.read}
      loadingLabel={words.eventsLoading}
      emptyTitle={view.emptyTitle}
      emptyMessage={view.emptyMessage}
      errorTitle={words.eventsFailed}
      retryLabel={words.tryAgain}
    >
      {view.read.kind === 'ready' ? (
        <View style={styles.body}>
          <View style={styles.head}>
            <Text variant="overline" color="tertiary">
              {words.eventsThisCycle}
            </Text>
            <Provenance source={words.actualUsage} size={12} />
          </View>
          <View style={styles.rows}>
            {view.read.value.map((event) => (
              <ListRow
                key={event.key}
                title={event.title}
                subtitle={event.subtitle}
                density="functional"
                style={styles.row}
                {...(event.figure === null
                  ? {}
                  : { trailing: <BillingValueText value={figure(event.figure)} /> })}
              />
            ))}
          </View>
          {view.more ? (
            <View style={styles.start}>
              <Button variant="ghost" size="md" onClick={onMore}>
                {words.showMore}
              </Button>
            </View>
          ) : null}
        </View>
      ) : null}
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  rows: { gap: theme.layout['tile-gap'] },
  row: { ...tileSurface, borderRadius: theme.radius['r-tile'] },
  start: { flexDirection: 'row' },
});
