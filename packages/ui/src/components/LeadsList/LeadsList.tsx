import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { CardRows } from '../CardRows';
import { EmptyState, FailedRead } from '../EmptyState';
import { LeadListRow, leadNextMarkOf, listedLeadOf } from '../LeadListRow';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance';
import type { LeadsListProps, LeadsListRows } from './LeadsList.types';

/**
 * The Leads list's read on the web (`SCR-M02-03`): its wait, its failure, the first run that
 * teaches, no match, or the leads — the screen's table at its width, else the card of rows — and
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
    <div className="hg-leads-list-rows" aria-busy={props.refreshing ? true : undefined}>
      {props.table ?? <Rows {...props} rows={view.rows} />}
      {view.unread > 0 ? (
        <Button
          variant="ghost"
          loading={props.loadingMore}
          icon={<ShellGlyph name="caret-down" size="sm" />}
          onClick={props.onShowMore}
        >
          {props.loadingMore ? words.loadingMore : words.showMore(view.unread)}
        </Button>
      ) : null}
    </div>
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
        <span className="hg-leads-list-teach">
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
        </span>
      }
    />
  );
}

/** Nothing matches; *Clear filters*, when something narrows the list, sends focus to the page. */
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
        focusAfter.current?.focus();
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
      <div className="hg-leads-list-colhead">
        <Text variant="overline" color="secondary">
          {words.columns.lead}
        </Text>
        <span className="hg-leads-list-colbill">
          <Text variant="overline" color="secondary">
            {words.columns.bill}
          </Text>
          <ProvenanceTier tier="assumed" />
        </span>
      </div>
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
