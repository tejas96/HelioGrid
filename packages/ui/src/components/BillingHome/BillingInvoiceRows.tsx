import type { TranslatedText } from '@heliogrid/contracts';
import { ShellGlyph } from '../AppShell';
import { DataTable, type DataTableColumn } from '../DataTable';
import { IconButton } from '../IconButton';
import { ListRow } from '../ListRow';
import type { BillingInvoiceRow, BillingTableWords } from './BillingHome.types';
import { BillingChipMark } from './BillingNeeds';

/** The PDF act; absent while the PDF is not made (`T-M12-012d`). */
function PdfAct({
  row,
  pending,
  waiting,
  onPdf,
}: {
  row: BillingInvoiceRow;
  /** This row's PDF is being signed. */
  pending: boolean;
  /** Another act's answer is out: the PDF act waits. */
  waiting: boolean;
  onPdf: (id: string) => void;
}) {
  if (row.pdfLabel === null) return null;
  return (
    <IconButton
      label={row.pdfLabel}
      variant="ghost"
      disabled={pending || waiting}
      onClick={() => onPdf(row.id)}
    >
      <ShellGlyph name="document" size="md" />
    </IconButton>
  );
}

/**
 * An invoice at 375 (decision 11): the date with its chip under it, the PDF, then the amount on
 * the right edge. The row holds the PDF act, so the row itself is no button.
 */
export function BillingInvoiceRows({
  rows,
  pendingPdf,
  waiting,
  onPdf,
}: {
  rows: readonly BillingInvoiceRow[];
  pendingPdf: string | null;
  waiting: boolean;
  onPdf: (id: string) => void;
}) {
  return (
    <>
      {rows.map((row) => (
        <ListRow
          key={row.id}
          className="hg-billing-flush"
          density="expressive"
          title={row.date}
          marks={<BillingChipMark chip={row.chip} />}
          trailing={
            <span className="hg-billing-invoice-end">
              <PdfAct row={row} pending={pendingPdf === row.id} waiting={waiting} onPdf={onPdf} />
              <span className="hg-billing-mono hg-billing-amount">{row.amount}</span>
            </span>
          }
        />
      ))}
    </>
  );
}

export interface BillingInvoiceColumnWords {
  readonly date: TranslatedText;
  readonly forWhat: TranslatedText;
  readonly state: TranslatedText;
  readonly pdf: TranslatedText;
  readonly amount: TranslatedText;
}

/** At width (decision 11): Date · For · State · PDF · Amount, the amount last on the right edge. */
export function BillingInvoiceTable({
  rows,
  columns,
  words,
  pendingPdf,
  waiting,
  onPdf,
  source,
}: {
  rows: readonly BillingInvoiceRow[];
  columns: BillingInvoiceColumnWords;
  words: BillingTableWords;
  pendingPdf: string | null;
  /** Another act's answer is out: every PDF act waits. */
  waiting: boolean;
  onPdf: (id: string) => void;
  source?: TranslatedText | null;
}) {
  const shape: DataTableColumn<BillingInvoiceRow>[] = [
    { key: 'date', label: columns.date, primary: true },
    { key: 'forWhat', label: columns.forWhat },
    { key: 'state', label: columns.state, render: (row) => <BillingChipMark chip={row.chip} /> },
    {
      key: 'pdf',
      label: columns.pdf,
      render: (row) => (
        <PdfAct row={row} pending={pendingPdf === row.id} waiting={waiting} onPdf={onPdf} />
      ),
    },
    {
      key: 'amount',
      label: columns.amount,
      numeric: true,
      mono: true,
      align: 'right',
      trailing: true,
    },
  ];
  return (
    <DataTable<BillingInvoiceRow>
      read={{ kind: 'ready' }}
      density="comfortable"
      rowKey="id"
      columns={shape}
      rows={[...rows]}
      words={words}
      emptyTitle={words.emptyTitle}
      errorTitle={words.errorTitle}
      unavailableTitle={words.unavailableTitle}
      provenance={source === null || source === undefined ? undefined : { source }}
    />
  );
}
