import type { TranslatedText } from '@heliogrid/contracts';
import type { SearchGroupView } from '@heliogrid/domain';
import { useId, useRef } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { CardRows } from '../CardRows';
import { EmptyScene } from '../EmptyScene/EmptyScene';
import { FailedRead } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider/market-context';
import { SearchResultRow } from './SearchResultRow';
import type { SearchResultsProps } from './SearchResults.types';
import './SearchResults.css';

/** The rows a group's wait stands for: a few, never one per result yet unknown. */
const WAITING_ROWS = ['row', 'row', 'row', 'row'] as const;

/**
 * Global Search's results on the web. One frame holds every state, so focus sent to it after a
 * *Try again* stays while the read is out again; the groups follow the read's own order.
 */
export function SearchResults<Failure>(props: SearchResultsProps<Failure>) {
  const { read, searching, words } = props;
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={frame}
      tabIndex={-1}
      className="hg-search-results hg-focus-target"
      aria-busy={searching || read.kind === 'loading' ? true : undefined}
    >
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
    </div>
  );
}

/** Nothing to list yet, or nothing found: what search covers, said quietly where the rows go. */
function SearchNote({ title, body }: { title: TranslatedText; body: TranslatedText }) {
  return (
    <div className="hg-search-note">
      <EmptyScene name="search" />
      <p className="hg-search-note-title">{title}</p>
      <p className="hg-search-note-body">{body}</p>
    </div>
  );
}

function SearchResultGroup<Failure>(
  props: SearchResultsProps<Failure> & { group: SearchGroupView<Failure> },
) {
  const { group, words, onOpen } = props;
  const format = useFormat();
  const heading = useId();
  const count = format.number(group.total);
  const { seeAll } = group;
  return (
    <section className="hg-search-group" aria-labelledby={heading}>
      <div className="hg-search-group-head">
        <h2 id={heading} className="hg-search-group-title">
          {words.group(group.group)}
        </h2>
        <span className="hg-search-group-count">{count}</span>
        {seeAll === null ? null : (
          <a
            className="hg-search-see-all"
            href={`/${seeAll}`}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              onOpen(seeAll);
            }}
          >
            {words.seeAll(count)}
            <ShellGlyph name="chevron-right" size="sm" tone="accent" />
          </a>
        )}
      </div>
      <CardRows form="joined">
        {group.rows.map((row, at) => (
          <SearchResultRow key={row.key} {...props} row={row} first={at === 0} />
        ))}
      </CardRows>
    </section>
  );
}
