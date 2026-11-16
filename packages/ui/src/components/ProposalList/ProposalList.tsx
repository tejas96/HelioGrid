import type { ProposalRow } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../DataTable/DataTableColumn.types';
import { EmptyState, FailedRead } from '../EmptyState';
import { IconButton } from '../IconButton';
import { LoadingBars } from '../LoadingBars';
import { failedReadOf } from '../ProposalAfterParts';
import { riseOrder } from '../ProposalBlocks/ProposalBlocks.logic';
import { ProposalStatus } from '../ProposalStatus';
import { StatusMark } from '../StatusMark';
import { filterChips, isQuietStanding } from './ProposalList.logic';
import type { ProposalListProps } from './ProposalList.types';
import './ProposalList.css';

type RowVars = CSSProperties & Record<'--i', number>;

function Standing({ row, words }: { row: ProposalRow; words: ProposalListProps['words'] }) {
  return (
    <span className="hg-plist-standing">
      <ProposalStatus
        standing={row.standing}
        label={words.standing(row.standing)}
        density="functional"
      />
      {row.stale ? <StatusMark tone="warning" label={words.stale} /> : null}
    </span>
  );
}

/** The corrective act of a row that is not current (`F8-18`): the builder, for a new version. */
function NewVersion({ row, words, onNewVersion }: ProposalListProps & { row: ProposalRow }) {
  if (!row.stale || onNewVersion === undefined) return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      spokenName={words.newVersionNamed(row)}
      icon={<ShellGlyph name="pencil" size="sm" tone="primary" />}
      onClick={() => onNewVersion(row)}
    >
      {words.newVersion}
    </Button>
  );
}

function Cards(props: ProposalListProps & { rows: readonly ProposalRow[] }) {
  const { rows, words, onOpen, onCopy } = props;
  return (
    <ul className="hg-plist-cards">
      {rows.map((row, index) => {
        const vars: RowVars = { '--i': riseOrder(index) };
        const price = words.price(row);
        return (
          <li
            key={row.id}
            style={vars}
            data-copy={onCopy === undefined ? undefined : ''}
            data-corrects={row.stale && props.onNewVersion !== undefined ? '' : undefined}
          >
            <Pressable
              className="hg-plist-card"
              accessibilityLabel={words.open(row)}
              onPress={() => onOpen(row)}
            >
              <span
                className="hg-plist-card-face"
                data-quiet={isQuietStanding(row.standing) ? '' : undefined}
              >
                <span className="hg-plist-card-top">
                  <b>{words.customer(row)}</b>
                  <Standing row={row} words={words} />
                </span>
                <span className="hg-plist-card-mid">
                  <span className="hg-plist-mono">{words.number(row)}</span>
                  <span>{words.system(row)}</span>
                  {price === null ? null : <span className="hg-plist-mono">{price}</span>}
                </span>
                <span className="hg-plist-card-line">{words.latest(row)}</span>
              </span>
            </Pressable>
            {row.stale && props.onNewVersion !== undefined ? (
              <span className="hg-plist-card-act">
                <NewVersion {...props} row={row} />
              </span>
            ) : null}
            {onCopy === undefined ? null : (
              <span className="hg-plist-card-copy">
                <IconButton
                  label={words.copyNamed(row)}
                  variant="surface"
                  onClick={() => onCopy(row)}
                >
                  <ShellGlyph name="layers" size="sm" tone="primary" />
                </IconButton>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Table(props: ProposalListProps & { rows: readonly ProposalRow[] }) {
  const { rows, words, onOpen, onCopy } = props;
  const columns: DataTableColumn<ProposalRow>[] = [
    {
      key: 'customer',
      label: words.columns.customer,
      primary: true,
      render: (row) => <b className="hg-plist-name">{words.customer(row)}</b>,
    },
    { key: 'number', label: words.columns.number, mono: true, render: (row) => words.number(row) },
    { key: 'system', label: words.columns.system, render: (row) => words.system(row) },
    {
      key: 'price',
      label: words.columns.price,
      numeric: true,
      mono: true,
      render: (row) => words.price(row) ?? '',
    },
    {
      key: 'status',
      label: words.columns.status,
      render: (row) => <Standing row={row} words={words} />,
    },
    {
      key: 'latest',
      label: words.columns.latest,
      render: (row) => <span className="hg-plist-latest">{words.latest(row)}</span>,
    },
  ];
  const table = {
    head: 'quiet' as const,
    caption: words.caption,
    columns,
    rows: [...rows],
    rowKey: (row: ProposalRow) => row.id,
    rowLabel: (row: ProposalRow) => words.open(row),
    onRowClick: onOpen,
    read: { kind: 'ready' as const },
    emptyTitle: words.emptyTitle,
    errorTitle: words.failedTitle,
    unavailableTitle: words.failedTitle,
    words: words.table,
  };
  if (onCopy === undefined && props.onNewVersion === undefined) return <DataTable {...table} />;
  return (
    <DataTable
      {...table}
      actionsLabel={words.columns.copy}
      rowActions={(row) => (
        <span className="hg-plist-row-acts">
          <NewVersion {...props} row={row} />
          {onCopy === undefined ? null : (
            <IconButton label={words.copyNamed(row)} variant="surface" onClick={() => onCopy(row)}>
              <ShellGlyph name="layers" size="sm" tone="primary" />
            </IconButton>
          )}
        </span>
      )}
    />
  );
}

function Body(props: ProposalListProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['row', 'row', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const rows = read.value.rows.items;
  if (rows.length === 0) {
    return <EmptyState scene="filter" title={words.emptyTitle} description={words.emptyLine} />;
  }
  return (
    <>
      {props.room === 'wide' ? <Table {...props} rows={rows} /> : <Cards {...props} rows={rows} />}
      {props.onMore === undefined ? null : (
        <span className="hg-plist-more">
          <Button variant="secondary" size="md" loading={props.loadingMore} onClick={props.onMore}>
            {words.more}
          </Button>
        </span>
      )}
    </>
  );
}

/** The proposals list, on the web (`SCR-M06-19`). */
export function ProposalList(props: ProposalListProps) {
  const { read, words, filter } = props;
  const counts = read.kind === 'ready' ? read.value.counts : null;
  return (
    <div className="hg-plist">
      {/* biome-ignore lint/a11y/useSemanticElements: a row of filter chips, not a form's fieldset */}
      <div className="hg-plist-filters" role="group" aria-label={words.filterLabel}>
        {filterChips(counts).map((chip) => (
          <Chip
            key={chip.filter}
            active={chip.filter === filter}
            count={chip.count}
            onClick={() => props.onFilter(chip.filter)}
          >
            {words.filter(chip.filter)}
          </Chip>
        ))}
      </div>
      <Body {...props} />
    </div>
  );
}
