import { DataTable } from '@heliogrid/ui';

/**
 * A stacked table whose one record is broken. `rowIssue` is read while the table renders, and a
 * function handed to `mount` answers from the test process — a promise, never the sentence — so
 * the sentence is bound here, in the browser.
 */
export function FlaggedStackedTable({
  label,
  value,
  issue,
  withEditor = false,
}: {
  label: string;
  value: string;
  issue: string;
  /** The record holds an editor and a select box — a card that lies on the page. */
  withEditor?: boolean;
}) {
  return (
    <DataTable
      columns={[{ key: 'name', label, primary: true, editable: withEditor }]}
      rows={[{ id: 1, name: value }]}
      rowIssue={() => issue}
      onCellCommit={withEditor ? () => undefined : undefined}
      selectable={withEditor}
      stackBelow={Number.MAX_SAFE_INTEGER}
    />
  );
}
