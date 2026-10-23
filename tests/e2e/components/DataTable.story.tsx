import { Button, DataTable } from '@heliogrid/ui';
import { useState } from 'react';

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

/**
 * A table whose rows open only when `rowOpens` lets them, each with an act of its own; the frame
 * reports the opened row as `data-opened` and an act as `data-acted`.
 */
export function OpeningTable({
  label,
  act,
  stacked = false,
}: {
  label: string;
  act: string;
  stacked?: boolean;
}) {
  const [opened, setOpened] = useState('');
  const [acted, setActed] = useState('');
  return (
    <div data-opened={opened} data-acted={acted}>
      <DataTable
        columns={[{ key: 'name', label, primary: true }]}
        rows={[
          { id: 1, name: 'Vikram Deshpande', opens: true },
          { id: 2, name: 'Deepak Jadhav', opens: false },
        ]}
        rowOpens={(row) => row.opens}
        onRowClick={(row) => setOpened(row.name)}
        actionsLabel={act}
        rowActions={(row) => (
          <Button variant="secondary" size="sm" onClick={() => setActed(row.name)}>
            {act}
          </Button>
        )}
        stackBelow={stacked ? Number.MAX_SAFE_INTEGER : 0}
      />
    </div>
  );
}
