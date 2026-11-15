import type { LeadsListScreen } from '@heliogrid/data/react';
import { type LeadsListWords, leadsListTopWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Button,
  type FocusHandle,
  IconButton,
  LargeTitle,
  LeadsList,
  LeadsListFilterBar,
  ShellGlyph,
  useFormat,
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
 * The page: its large title with *Add lead* and *Import* at its end, its summary, the head of
 * filters, then the list's read (`LeadsList`, the web's too). The first run teaches both ways in
 * itself, so the title carries neither. *Try again* and *Clear filters* land the screen reader on the title, which stays
 * while the list reads again.
 */
export function LeadsListBody({ screen, words, moves }: BodyProps) {
  const title = useRef<FocusHandle>(null);
  const { t, locale } = useI18n();
  const format = useFormat();
  const { read } = screen;
  const summary =
    read.kind === 'ready' && read.value.filtersOn > 0
      ? words.summary({
          matching: read.value.matching,
          filtersOn: read.value.filtersOn,
        })
      : read.kind === 'empty'
        ? words.firstRunSummary
        : undefined;
  return (
    <View style={styles.page}>
      <LargeTitle
        title={words.title}
        summary={summary}
        titleRef={title}
        {...(read.kind === 'empty'
          ? {}
          : {
              acts: (
                <>
                  {screen.canImport ? (
                    <IconButton label={words.import} variant="surface" onClick={moves.import}>
                      <ShellGlyph name="upload" size="sm" />
                    </IconButton>
                  ) : null}
                  {screen.canAdd ? (
                    <Button
                      size="md"
                      icon={<ShellGlyph name="plus" size="sm" tone="inverse" />}
                      onClick={moves.add}
                    >
                      {words.addLead}
                    </Button>
                  ) : null}
                </>
              ),
            })}
      />
      {read.kind === 'ready' ? (
        <LeadsListFilterBar
          screen={screen}
          pipeline={read.value.pipeline}
          matching={read.value.matching}
          room="narrow"
          words={words}
          top={leadsListTopWords(t, { pack: format.pack, language: locale, now: Date.now() })}
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
        onAdd={screen.canAdd ? moves.add : null}
        onImport={screen.canImport ? moves.import : null}
        onOpen={moves.open}
        focusAfter={title}
        table={null}
      />
    </View>
  );
}
