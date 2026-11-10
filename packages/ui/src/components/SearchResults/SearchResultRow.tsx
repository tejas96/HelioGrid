import type { SearchLeadRow, SearchNumber, SearchRow } from '@heliogrid/domain';
import { useRef } from 'react';
import { type FocusAfter, type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { CardRow } from '../CardRows';
import { Badge } from '../Chip/Chip';
import { LeadSourceMark } from '../LeadSourceMark';
import { LeadStateBadge } from '../LeadStateBadge';
import { NamedGap } from '../NamedGap';
import { PendingAction } from '../PendingAction';
import { CATALOG_GLYPH, numberRuns, rowNameOf, rowOpenOf } from './SearchResults.logic';
import type { SearchResultsProps } from './SearchResults.types';

type RowProps<Failure> = SearchResultsProps<Failure> & {
  row: SearchRow<Failure>;
  first: boolean;
};

/**
 * One result: a link to its record (`/leads/…`) that opens in place on a plain click, under the
 * row's words. A junk lead's Reopen sits at its end, outside the link, and its line under it.
 */
export function SearchResultRow<Failure>(props: RowProps<Failure>) {
  const { row, first, cursor, onOpen, onReopen, words } = props;
  const target = useRef<FocusHandle>(null);
  const open = rowOpenOf(row, words, onOpen);
  const reopen = row.kind === 'lead' ? row.reopen : null;
  return (
    <CardRow
      first={first}
      open={
        open === undefined
          ? undefined
          : { ...open, href: `/${open.address}`, current: cursor === row.key }
      }
      targetRef={target}
      highlighted={cursor === row.key}
      busy={reopen?.kind === 'waiting'}
      aside={
        row.kind === 'lead' && reopen !== null ? (
          <ReopenAct
            row={row}
            waiting={reopen.kind === 'waiting'}
            onReopen={() => onReopen(row.id)}
            focusAfter={target}
            words={words}
          />
        ) : open === undefined ? null : (
          <span className="hg-search-row-end" aria-hidden="true">
            <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
          </span>
        )
      }
      after={
        reopen === null || reopen.kind === 'offered' ? undefined : (
          <PendingAction
            label={words.reopening}
            state={reopen.kind === 'waiting' ? 'waiting' : 'returned'}
            reason={reopen.kind === 'returned' ? words.reopenReturned(reopen.failure) : undefined}
          />
        )
      }
      className="hg-search-row"
    >
      <RowFace row={row} />
      <span className="hg-search-row-main">
        <RowWords {...props} />
      </span>
    </CardRow>
  );
}

function RowFace<Failure>({ row }: { row: SearchRow<Failure> }) {
  if (row.kind === 'catalog_item') {
    return (
      <span className="hg-search-tile" aria-hidden="true">
        <ShellGlyph name={CATALOG_GLYPH[row.componentKind]} size="md" tone="secondary" />
      </span>
    );
  }
  return (
    <span
      className="hg-search-face"
      data-junk={row.kind === 'lead' && row.state === 'junk' ? 'true' : undefined}
    >
      <Avatar name={rowNameOf(row) ?? undefined} size={40} />
    </span>
  );
}

function RowWords<Failure>({ row, words }: RowProps<Failure>) {
  const name = rowNameOf(row);
  const title = (
    <span className="hg-search-row-title">
      {name ?? <NamedGap gap={words.noName} scale="field" />}
    </span>
  );
  if (row.kind === 'person') {
    return (
      <>
        {title}
        {row.you ? <Badge tone="neutral">{words.you}</Badge> : null}
      </>
    );
  }
  if (row.kind === 'catalog_item') {
    return (
      <>
        {title}
        <span className="hg-search-row-line">{words.componentKind(row.componentKind)}</span>
      </>
    );
  }
  return (
    <>
      <span className="hg-search-row-top">
        {title}
        {row.exact ? <Badge tone="accent">{words.numberMatch}</Badge> : null}
      </span>
      <span className="hg-search-row-line">
        <SearchNumberText number={row.number} />
        {row.city === null ? <NamedGap gap={words.noCity} scale="cell" /> : <span>{row.city}</span>}
      </span>
      {row.kind === 'lead' ? <LeadMarks row={row} words={words} /> : null}
    </>
  );
}

function LeadMarks<Failure>({
  row,
  words,
}: {
  row: SearchLeadRow<Failure>;
  words: SearchResultsProps<Failure>['words'];
}) {
  if (row.state !== null) {
    return (
      <span className="hg-search-row-marks">
        <LeadStateBadge state={row.state} label={words.state(row.state)} />
      </span>
    );
  }
  return (
    <span className="hg-search-row-marks">
      <LeadSourceMark source={row.source} label={words.source(row.source)} form="glyph" />
      <span>{words.stage(row.stage)}</span>
    </span>
  );
}

/** The number in the market's form, the digits typed marked across its spaces. */
function SearchNumberText({ number }: { number: SearchNumber }) {
  const runs = numberRuns(number);
  return (
    <span className="hg-search-number">
      {runs.before}
      {runs.typed === '' ? null : <mark className="hg-search-typed">{runs.typed}</mark>}
      {runs.after}
    </span>
  );
}

/**
 * Reopen: one press, busy while out and keeping focus; once it lands it leaves, and focus goes to
 * the row's link.
 */
function ReopenAct<Failure>({
  row,
  waiting,
  onReopen,
  focusAfter,
  words,
}: {
  row: SearchLeadRow<Failure>;
  waiting: boolean;
  onReopen: () => void;
  focusAfter: FocusAfter;
  words: SearchResultsProps<Failure>['words'];
}) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<ShellGlyph name="undo" size="sm" tone="primary" />}
      spokenName={words.reopenNamed(row.name)}
      loading={waiting}
      onClick={leaving(onReopen)}
    >
      {words.reopen}
    </Button>
  );
}
