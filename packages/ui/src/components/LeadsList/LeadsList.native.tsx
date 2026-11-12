import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { landFocusOn } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { CardRows } from '../CardRows/CardRows.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { leadNextMarkOf, listedLeadOf } from '../LeadListRow/LeadListRow.logic';
import { LeadListRow } from '../LeadListRow/LeadListRow.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import type { LeadsListProps, LeadsListRows } from './LeadsList.types';

/**
 * The Leads list's read on the phone (`SCR-M02-03`): its wait, its failure, the first run that
 * teaches with its two ways in stacked in thumb reach, no match, or the card of rows and
 * *Show more*.
 */
export function LeadsList(props: LeadsListProps) {
  const { read, words, focusAfter } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={focusAfter}
      />
    );
  }
  if (read.kind === 'empty') return <FirstRun {...props} />;
  const view = read.value;
  if (view.noMatch) return <NoMatch {...props} clearable={view.clearable} />;
  return (
    <View style={styles.rows}>
      {props.table ?? <Rows {...props} rows={view.rows} />}
      {view.unread > 0 ? (
        <View style={styles.more}>
          <Button
            variant="ghost"
            loading={props.loadingMore}
            icon={<ShellGlyph name="caret-down" size="sm" />}
            onClick={props.onShowMore}
          >
            {props.loadingMore ? words.loadingMore : words.showMore(view.unread)}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

/** The first run: what will appear here, *Add a lead* first, and *Import a file* for who may. */
function FirstRun({ words, onAdd, onImport }: LeadsListProps) {
  return (
    <EmptyState
      scene="settle"
      title={words.firstRun.title}
      description={words.firstRun.body}
      action={
        <View style={styles.teach}>
          <Button variant="primary" icon={<ShellGlyph name="plus" size="sm" />} onClick={onAdd}>
            {words.firstRun.add}
          </Button>
          {onImport === null ? null : (
            <Button
              variant="secondary"
              icon={<ShellGlyph name="upload" size="sm" />}
              onClick={onImport}
            >
              {words.firstRun.import}
            </Button>
          )}
        </View>
      }
    />
  );
}

/** Nothing matches; *Clear filters*, when something narrows the list, lands the reader on the page. */
function NoMatch({
  words,
  onClearFilters,
  focusAfter,
  clearable,
}: LeadsListProps & { clearable: boolean }) {
  const clear = (
    <Button
      variant="primary"
      icon={<ShellGlyph name="close" size="sm" />}
      onClick={() => {
        onClearFilters();
        landFocusOn(focusAfter);
      }}
    >
      {words.noMatch.clear}
    </Button>
  );
  return (
    <EmptyState
      scene="filter"
      title={words.noMatch.title}
      {...(clearable ? { description: words.noMatch.body, action: clear } : {})}
    />
  );
}

/** The column's head with the bill's one tier, then one card of rows, each opening its lead. */
function Rows({ rows, words, onOpen }: LeadsListProps & { rows: LeadsListRows }) {
  const format = useFormat();
  return (
    <>
      <View style={styles.colhead}>
        <Text variant="overline" color="secondary">
          {words.columns.lead}
        </Text>
        <View style={styles.colbill}>
          <Text variant="overline" color="secondary">
            {words.columns.bill}
          </Text>
          <ProvenanceTier tier="assumed" />
        </View>
      </View>
      <CardRows form="separate">
        {rows.map((row, index) => (
          <LeadListRow
            key={row.lead.id}
            lead={listedLeadOf(row.lead, format.pack)}
            sourceLabel={words.sourceWord(row.lead.source)}
            next={leadNextMarkOf(row.next, words.next(row.next))}
            first={index === 0}
            onOpen={() => onOpen(row.lead.id)}
            words={words.row}
          />
        ))}
      </CardRows>
    </>
  );
}

const styles = StyleSheet.create({
  rows: { gap: theme.spacing['sp-3'] },
  more: { alignSelf: 'center' },
  teach: { gap: theme.spacing['sp-2'], alignItems: 'stretch' },
  colhead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  colbill: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
