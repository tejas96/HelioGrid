import type {
  ProposalEntry,
  ProposalEntryDesign,
  ProposalEntryProposal,
  ProposalRow,
} from '@heliogrid/contracts';
import { type CSSProperties, Fragment } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Badge, Chip } from '../Chip';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../DataTable/DataTableColumn.types';
import { DesignCover } from '../DesignCover';
import { DesignStatus } from '../DesignStatus';
import { EmptyState, FailedRead } from '../EmptyState';
import { IconButton } from '../IconButton';
import { LoadingBars } from '../LoadingBars';
import { failedReadOf } from '../ProposalAfterParts';
import { riseOrder } from '../ProposalBlocks/ProposalBlocks.logic';
import { ProposalStatus } from '../ProposalStatus';
import { StatusMark } from '../StatusMark';
import { emptyWordsOf, filterChips, isQuietStanding, THREE_D_GLYPH } from './ProposalList.logic';
import type { ProposalListProps } from './ProposalList.types';
import './ProposalList.css';

type RowVars = CSSProperties & Record<'--i', number>;
type Words = ProposalListProps['words'];

/** The 3D mark: a KIND, in the kind badge's tone, never a state. */
function Mark3d({ words }: { words: Words }) {
  return (
    <Badge tone="ocean" glyph={THREE_D_GLYPH}>
      {words.filter('3d')}
    </Badge>
  );
}

/** A design's spoken name and its last change. */
const rowLabelOf = (row: ProposalEntry, words: Words) =>
  row.kind === 'design' ? words.design.open(row) : words.open(row);

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

/** A design with no proposal yet, on a phone's width: its cover with the 3D mark, then its facts. */
function DesignCard({ row, words, onOpen }: ProposalListProps & { row: ProposalEntryDesign }) {
  return (
    <Pressable
      className="hg-plist-card"
      accessibilityLabel={words.design.open(row)}
      onPress={() => onOpen(row)}
    >
      <span className="hg-plist-card-face">
        <DesignCover word={words.design.preview} mark={<Mark3d words={words} />} />
        <span className="hg-plist-card-top">
          <b>{words.customer(row)}</b>
          <span className="hg-plist-standing">
            <DesignStatus
              status={row.status}
              label={words.design.status(row.status)}
              density="functional"
            />
          </span>
        </span>
        <span className="hg-plist-card-mid">
          <span>{words.design.noPanels}</span>
        </span>
        <span className="hg-plist-card-line">{words.design.latest(row)}</span>
      </span>
    </Pressable>
  );
}

/** A proposal on a phone's width: its face presses to open it; its acts sit beside and under it. */
function ProposalCard(props: ProposalListProps & { row: ProposalEntryProposal; vars: RowVars }) {
  const { row, vars, words, onOpen, onCopy } = props;
  const price = words.price(row);
  return (
    <li
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
          <IconButton label={words.copyNamed(row)} variant="surface" onClick={() => onCopy(row)}>
            <ShellGlyph name="layers" size="sm" tone="primary" />
          </IconButton>
        </span>
      )}
    </li>
  );
}

function Cards(props: ProposalListProps & { rows: readonly ProposalEntry[] }) {
  const { rows } = props;
  return (
    <ul className="hg-plist-cards">
      {rows.map((row, index) => {
        const vars: RowVars = { '--i': riseOrder(index) };
        if (row.kind === 'design') {
          return (
            <li key={`design:${row.id}`} style={vars}>
              <DesignCard {...props} row={row} />
            </li>
          );
        }
        return <ProposalCard key={row.id} {...props} row={row} vars={vars} />;
      })}
    </ul>
  );
}

/** The customer cell: a design's model picture — a house until there is one — its name and the 3D mark. */
function Customer({ row, words }: { row: ProposalEntry; words: Words }) {
  if (row.kind === 'proposal') return <b className="hg-plist-name">{words.customer(row)}</b>;
  return (
    <span className="hg-plist-customer">
      <span className="hg-plist-thumb" aria-hidden="true">
        <ShellGlyph name="house" size="sm" tone="secondary" />
      </span>
      <b className="hg-plist-name">{words.customer(row)}</b>
      <Mark3d words={words} />
    </span>
  );
}

function Table(props: ProposalListProps & { rows: readonly ProposalEntry[] }) {
  const { rows, words, onOpen, onCopy } = props;
  const columns: DataTableColumn<ProposalEntry>[] = [
    {
      key: 'customer',
      label: words.columns.customer,
      primary: true,
      render: (row) => <Customer row={row} words={words} />,
    },
    {
      key: 'number',
      label: words.columns.number,
      mono: true,
      render: (row) => (row.kind === 'design' ? words.design.noFigure : words.number(row)),
    },
    {
      key: 'system',
      label: words.columns.system,
      render: (row) => (row.kind === 'design' ? words.design.noPanels : words.system(row)),
    },
    {
      key: 'price',
      label: words.columns.price,
      numeric: true,
      mono: true,
      render: (row) => (row.kind === 'design' ? words.design.noFigure : (words.price(row) ?? '')),
    },
    {
      key: 'status',
      label: words.columns.status,
      render: (row) =>
        row.kind === 'design' ? (
          <DesignStatus
            status={row.status}
            label={words.design.status(row.status)}
            density="functional"
          />
        ) : (
          <Standing row={row} words={words} />
        ),
    },
    {
      key: 'latest',
      label: words.columns.latest,
      render: (row) => (
        <span className="hg-plist-latest">
          {row.kind === 'design' ? words.design.latest(row) : words.latest(row)}
        </span>
      ),
    },
  ];
  const table = {
    head: 'quiet' as const,
    caption: words.caption,
    columns,
    rows: [...rows],
    rowKey: (row: ProposalEntry) => `${row.kind}:${row.id}`,
    rowLabel: (row: ProposalEntry) => rowLabelOf(row, words),
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
      rowActions={(row) =>
        row.kind === 'design' ? null : (
          <span className="hg-plist-row-acts">
            <NewVersion {...props} row={row} />
            {onCopy === undefined ? null : (
              <IconButton
                label={words.copyNamed(row)}
                variant="surface"
                onClick={() => onCopy(row)}
              >
                <ShellGlyph name="layers" size="sm" tone="primary" />
              </IconButton>
            )}
          </span>
        )
      }
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
  if (rows.length === 0) return <EmptyState scene="filter" {...emptyWordsOf(props)} />;
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

/** The Proposals page's list, on the web (`SCR-M06-19`, `T-M05-001b`). */
export function ProposalList(props: ProposalListProps) {
  const { read, words, filter } = props;
  const counts = read.kind === 'ready' ? read.value.counts : null;
  return (
    <div className="hg-plist">
      {/* biome-ignore lint/a11y/useSemanticElements: a row of filter chips, not a form's fieldset */}
      <div className="hg-plist-filters" role="group" aria-label={words.filterLabel}>
        {filterChips(counts).map((chip) => (
          <Fragment key={chip.filter}>
            <Chip
              active={chip.filter === filter}
              count={chip.count}
              {...(chip.glyph === undefined ? {} : { glyph: chip.glyph })}
              onClick={() => props.onFilter(chip.filter)}
            >
              {words.filter(chip.filter)}
            </Chip>
            {chip.ruleAfter ? <i className="hg-plist-rule" aria-hidden="true" /> : null}
          </Fragment>
        ))}
      </div>
      <Body {...props} />
    </div>
  );
}
