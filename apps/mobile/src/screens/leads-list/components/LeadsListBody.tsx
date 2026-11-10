import type { LeadsListScreen } from '@heliogrid/data/react';
import type { LeadsListWords } from '@heliogrid/i18n';
import {
  Button,
  type FocusHandle,
  LargeTitle,
  LeadsList,
  LeadsListFilterBar,
  ShellGlyph,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import type { LeadsListMoves } from '../hooks/use-leads-list-moves';
import { styles } from '../styles';

interface BodyProps {
  screen: LeadsListScreen;
  words: LeadsListWords;
  moves: LeadsListMoves;
}

/**
 * The page: its large title and summary, the head of filters, then the list's read (`LeadsList`,
 * the web's too). *Try again* and *Clear filters* land the screen reader on the title, which stays
 * while the list reads again.
 */
export function LeadsListBody({ screen, words, moves }: BodyProps) {
  const title = useRef<FocusHandle>(null);
  const { read } = screen;
  const summary =
    read.kind === 'ready'
      ? words.summary({
          open: read.value.pipeline.open,
          waiting: screen.inboxWaiting,
          matching: read.value.matching,
          filtersOn: read.value.filtersOn,
        })
      : read.kind === 'empty'
        ? words.firstRunSummary
        : undefined;
  return (
    <View style={styles.page}>
      <LargeTitle title={words.title} summary={summary} titleRef={title} />
      {screen.canImport && read.kind !== 'empty' ? (
        <View style={styles.acts}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ShellGlyph name="upload" size="sm" />}
            onClick={moves.import}
          >
            {words.import}
          </Button>
        </View>
      ) : null}
      {read.kind === 'ready' ? (
        <LeadsListFilterBar
          screen={screen}
          pipeline={read.value.pipeline}
          form="card"
          words={words}
          onInbox={moves.inbox}
        />
      ) : null}
      <LeadsList
        read={read}
        words={words}
        refreshing={screen.refreshing}
        loadingMore={screen.loadingMore}
        onShowMore={screen.showMore}
        onClearFilters={screen.clearFilters}
        onAdd={moves.add}
        onImport={screen.canImport ? moves.import : null}
        onOpen={moves.open}
        focusAfter={title}
        table={null}
      />
    </View>
  );
}
