'use client';
import type { LeadListRow as LeadListRowWire } from '@heliogrid/contracts';
import type { LeadsListScreen } from '@heliogrid/data/react';
import type { LeadsListRow, LeadsListSort, LeadsListView } from '@heliogrid/domain';
import { DATA_TABLE, dataTableWords, type LeadsListWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  Avatar,
  DataTable,
  type DataTableColumn,
  type DataTableSort,
  LeadNextMark,
  LeadSourceMark,
  leadNextMarkOf,
  listedBillOrderOf,
  listedLeadOf,
  NamedGap,
  ShellGlyph,
  StatusMark,
  useFormat,
} from '@heliogrid/ui';

type Row = LeadsListRow<LeadListRowWire>;

/** The table's sortable columns and the list's orders they stand for; newest first is no column's. */
const COLUMN_OF_SORT = { monthly_bill: 'bill', last_activity: 'lastActivity' } as const;
const LIST_SORT_KEYS = Object.keys(COLUMN_OF_SORT) as (keyof typeof COLUMN_OF_SORT)[];

function tableSortOf(sort: LeadsListSort): DataTableSort | null {
  return sort.key === 'created_at' ? null : { key: COLUMN_OF_SORT[sort.key], dir: sort.order };
}

/** The list's order a header asks for; a column with no order of its own asks for none. */
function listSortOf(sort: DataTableSort): LeadsListSort | null {
  const key = LIST_SORT_KEYS.find((each) => COLUMN_OF_SORT[each] === sort.key);
  return key === undefined ? null : { key, order: sort.dir };
}

/**
 * The leads at the table's width (`SCR-M02-03`), as OneOhm draws a table — lines, no card: the lead
 * (name, number, city), stage, source, the monthly bill in the tenant's currency with its one tier
 * on the head and sortable (`M02-40`), owner, what comes next and the last activity. The server
 * orders every page, and `DataTable` re-sorts the rows it holds by the active column — so each key
 * must order exactly as the server does: the bill in whole minor units, never a float, and a lead
 * whose bill is unknown last either way.
 */
export function LeadsTable({
  screen,
  view,
  words,
  onOpen,
}: {
  screen: LeadsListScreen;
  view: LeadsListView<LeadListRowWire>;
  words: LeadsListWords;
  onOpen: (leadId: string) => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const sort = tableSortOf(screen.filters.sort);
  const unknownLast = sort?.dir === 'desc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const columns: DataTableColumn<Row>[] = [
    {
      key: 'lead',
      label: words.columns.lead,
      primary: true,
      width: '27%',
      render: ({ lead }) => (
        <span className="hg-leads-list-person">
          {lead.name === null ? (
            <Avatar size={theme.spacing['sp-10']} glyph={<ShellGlyph name="phone" size="sm" />} />
          ) : (
            <Avatar name={lead.name} size={theme.spacing['sp-10']} />
          )}
          <span className="hg-leads-list-lead">
            {lead.name === null ? (
              <span className="hg-leads-list-lead-name hg-leads-list-mono">
                {format.phone(lead.phoneE164)}
              </span>
            ) : (
              <span className="hg-leads-list-lead-name">{lead.name}</span>
            )}
            <span className="hg-leads-list-lead-sub">
              {lead.name === null ? (
                <NamedGap gap={words.row.noName} scale="cell" />
              ) : (
                <span className="hg-leads-list-mono">{format.phone(lead.phoneE164)}</span>
              )}
              {lead.city ?? <NamedGap gap={words.row.noCity} scale="cell" />}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'stage',
      label: words.columns.stage,
      width: '13%',
      render: ({ lead }) => <StatusMark tone="accent" label={words.row.stage(lead.stage)} />,
    },
    {
      key: 'source',
      label: words.columns.source,
      width: '11%',
      render: ({ lead }) => (
        <LeadSourceMark source={lead.source} label={words.sourceWord(lead.source)} />
      ),
    },
    {
      key: 'bill',
      label: words.columns.bill,
      numeric: true,
      mono: true,
      width: '12%',
      sortable: true,
      provenance: 'assumed',
      sortValue: ({ lead }) => listedBillOrderOf(lead, format.pack) ?? unknownLast,
      gap: ({ lead }) => (lead.monthlyBill === null ? words.row.noBill : null),
      render: ({ lead }) => listedLeadOf(lead, format.pack).bill,
    },
    {
      key: 'owner',
      label: words.columns.owner,
      width: '13%',
      render: ({ lead }) =>
        lead.owner === null ? (
          <NamedGap gap={words.row.noOwner} scale="cell" />
        ) : (
          <span className="hg-leads-list-person">
            <Avatar name={lead.owner.name} size={theme.spacing['sp-6']} />
            {lead.owner.name}
          </span>
        ),
    },
    {
      key: 'next',
      label: words.columns.next,
      width: '14%',
      render: ({ next }) => {
        const mark = leadNextMarkOf(next, words.next(next));
        return mark === null ? null : <LeadNextMark {...mark} />;
      },
    },
    {
      key: 'lastActivity',
      label: words.columns.lastActivity,
      width: '10%',
      muted: true,
      sortable: true,
      sortValue: ({ lead }) => Date.parse(lead.lastActivityAt),
      render: ({ sinceActivityMs }) => words.lastActivity(sinceActivityMs),
    },
  ];
  return (
    <DataTable
      head="quiet"
      caption={words.title}
      columns={columns}
      rows={[...view.rows]}
      rowKey={(row) => row.lead.id}
      rowLabel={(row) => words.row.open(row.lead.name)}
      onRowClick={(row) => onOpen(row.lead.id)}
      sortable
      sort={sort}
      onSortChange={(next) => {
        const asked = listSortOf(next);
        if (asked !== null) screen.setSort(asked);
      }}
      read={{ kind: 'ready' }}
      words={dataTableWords(t)}
      emptyTitle={words.noMatch.title}
      errorTitle={t(DATA_TABLE.errorTitle)}
      unavailableTitle={t(DATA_TABLE.unavailableTitle)}
      stackBelow={0}
    />
  );
}
