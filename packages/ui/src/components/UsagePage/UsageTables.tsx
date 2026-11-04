import type { TranslatedText, UsageEventMeter } from '@heliogrid/contracts';
import { ShellGlyph } from '../AppShell';
import { BillingChipMark } from '../BillingHome/BillingNeeds';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Block } from '../Block';
import { Button } from '../Button';
import { DataTable, type DataTableColumn } from '../DataTable';
import { FactRow, FactRows } from '../FactRow';
import { IconButton } from '../IconButton';
import type { UsagePageView, UsagePageWords, UsageTableRow } from './UsagePage.types';
import { UsageNeeds, UsagePlainFigure, UsagePlansRow, UsageSources } from './UsageRegion';

interface TableActs {
  readonly onLedger: (meter: UsageEventMeter) => void;
  readonly onPlans: () => void;
}

type Tables = NonNullable<UsagePageView['tables']>;

/** The meter's name with its chip beside it (decision 7), wrapping as one cell. */
function nameCell(row: UsageTableRow) {
  if (row.chip === null) return row.label;
  return (
    <span className="hg-usage-meter-cell">
      <span>{row.label}</span>
      <BillingChipMark chip={row.chip} />
    </span>
  );
}

/**
 * One region's table at 1536 (decision 7). `Limits`: limit · used this cycle · allowed. `Included
 * each month`: meter · used this cycle · included · rate · charges so far. The row acts: a meter's
 * ledger opener, and `Bigger plans` on the meter at its cap or paused (decision 12).
 */
function UsageTable({
  kind,
  title,
  sources,
  caption,
  rows,
  words,
  plans,
  acts,
}: {
  kind: 'limits' | 'included';
  title: TranslatedText;
  sources: readonly TranslatedText[] | null;
  caption: TranslatedText;
  rows: readonly UsageTableRow[];
  words: UsagePageWords;
  plans: UsagePageView['plans'];
  acts: TableActs;
}) {
  const { columns } = words;
  const used: DataTableColumn<UsageTableRow> = {
    key: 'used',
    label: columns.used,
    numeric: true,
    sub: (row) => row.usedSub,
  };
  const shape: DataTableColumn<UsageTableRow>[] =
    kind === 'limits'
      ? [
          { key: 'label', label: columns.limit, primary: true, strong: true, render: nameCell },
          used,
          { key: 'included', label: columns.allowed, align: 'right' },
        ]
      : [
          { key: 'label', label: columns.meter, primary: true, strong: true, render: nameCell },
          used,
          { key: 'included', label: columns.included, align: 'right' },
          {
            key: 'rate',
            label: columns.rate,
            align: 'right',
            render: (row) => <BillingValueText value={row.rate} />,
            gap: (row) =>
              row.rateGap === null ? null : { gap: row.rateGap, scale: 'cell', align: 'right' },
          },
          { key: 'charges', label: columns.charges, numeric: true, mono: true },
        ];
  const rowAct = (row: UsageTableRow) => {
    const { ledger } = row;
    if (ledger !== null) {
      return (
        <IconButton
          label={words.eventsOf(row.label)}
          variant="ghost"
          size={44}
          onClick={() => acts.onLedger(ledger)}
        >
          <ShellGlyph name="chevron-right" size="md" />
        </IconButton>
      );
    }
    if (row.plans && plans !== null) {
      return (
        <Button
          variant="secondary"
          size="sm"
          icon={<ShellGlyph name="layers" size="sm" />}
          onClick={acts.onPlans}
        >
          {plans.title}
        </Button>
      );
    }
    return null;
  };
  /* The acts column is named for what it holds: the events on `Included`, the way on on `Limits`. */
  const actionsLabel = kind === 'included' ? words.eventsThisCycle : plans?.title;
  const acted = rows.some((row) => row.ledger !== null || (row.plans && plans !== null));
  return (
    <Block
      title={title}
      density="functional"
      footer={sources === null ? undefined : <UsageSources sources={sources} />}
    >
      <DataTable<UsageTableRow>
        read={{ kind: 'ready' }}
        density="compact"
        rowKey="key"
        caption={caption}
        columns={shape}
        rows={[...rows]}
        rowLabel={(row) => row.label}
        words={words.table}
        emptyTitle={caption}
        errorTitle={words.errorTitle}
        unavailableTitle={words.errorTitle}
        {...(acted && actionsLabel !== undefined
          ? { rowActions: rowAct, actionsLabel }
          : { rowActions: undefined })}
      />
    </Block>
  );
}

/** The tables lane at 1536: `Needs you` for a person who is not the Owner, then the two tables. */
export function UsageTablesLane({
  view,
  tables,
  words,
  acts,
}: {
  view: UsagePageView;
  tables: Tables;
  words: UsagePageWords;
  acts: TableActs;
}) {
  return (
    <>
      {view.limits === null ? null : (
        <UsageTable
          kind="limits"
          title={view.limits.title}
          sources={view.limits.sources}
          caption={tables.limitsCaption}
          rows={tables.limits}
          words={words}
          plans={view.plans}
          acts={acts}
        />
      )}
      {view.included === null ? null : (
        <UsageTable
          kind="included"
          title={view.included.title}
          sources={view.included.sources}
          caption={tables.includedCaption}
          rows={tables.included}
          words={words}
          plans={view.plans}
          acts={acts}
        />
      )}
    </>
  );
}

/**
 * The standing column at 1536 (decision 7): `Needs you` where it exists, `This cycle` with the one
 * status chip as its badge, `Extra charges` while any accrue, and `Bigger plans`.
 */
export function UsageStanding({
  view,
  words,
  needsTitle,
  onPlans,
}: {
  view: UsagePageView;
  words: UsagePageWords;
  needsTitle: TranslatedText;
  onPlans: () => void;
}) {
  return (
    <>
      {view.needs === null ? null : <UsageNeeds title={needsTitle} rows={view.needs} />}
      {view.cycle === null ? null : (
        <Block
          title={words.thisCycle}
          density="expressive"
          badge={view.chip === null ? undefined : <BillingChipMark chip={view.chip} />}
        >
          <FactRows className="hg-usage-facts" label={words.thisCycle} density="expressive">
            <FactRow label={words.cycle} value={<UsagePlainFigure text={view.cycle.range} />} />
            <FactRow label={words.resets} value={<UsagePlainFigure text={view.cycle.resets} />} />
          </FactRows>
        </Block>
      )}
      {view.extra === null ? null : (
        <Block title={words.extraCharges} density="expressive">
          <FactRows className="hg-usage-facts" label={words.extraCharges} density="expressive">
            <FactRow label={words.soFar} value={<UsagePlainFigure text={view.extra.total} />} />
            <FactRow label={words.billsOn} value={<UsagePlainFigure text={view.extra.billsOn} />} />
          </FactRows>
        </Block>
      )}
      {view.plans === null ? null : <UsagePlansRow plans={view.plans} onPlans={onPlans} />}
    </>
  );
}
