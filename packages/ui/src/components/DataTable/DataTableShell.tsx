import { UnavailableNote } from '../UnavailableNote';
import type { DataTableProps } from './DataTable.types';
import { TableMessage, TableSkeleton } from './DataTableChrome';

/**
 * **The caption is not inside the `<table>`.** As a `<caption>` element it vanished on every phone
 * and in every narrow panel, so it sits in the shell — above both forms and every state message —
 * and both forms take their accessible name from it (`F7-27`).
 */
export function TableCaption({
  caption,
  continued,
  id,
}: {
  caption: string | undefined;
  continued: boolean;
  id: string;
}) {
  if (caption === undefined) return null;
  return (
    <div className="hg-dt-caption" id={id}>
      {caption}
      {continued ? ' (continued)' : ''}
    </div>
  );
}

/**
 * **What stands in for the records** when there are none to show. `unavailable` is the fourth
 * state: these records were never going to be here — neutral, and **no retry, ever**. It is
 * `UnavailableNote`'s to render, not a `TableMessage` wearing its words: the note is the one
 * treatment in the system that carries the neutral mark and refuses a retry by construction.
 */
export function TableStates<Row>({
  table,
  stacked,
}: {
  table: DataTableProps<Row>;
  stacked: boolean;
}) {
  const {
    state = 'ready',
    emptyTitle = 'Nothing here yet',
    emptyDescription,
    emptyAction,
    errorTitle = "Couldn't load these records",
    errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
    onRetry,
    unavailableTitle = 'Not available here',
    unavailableMessage,
  } = table;

  return (
    <>
      {state === 'loading' ? <TableSkeleton stacked={stacked} /> : null}
      {state === 'error' ? (
        <TableMessage tone="warning" title={errorTitle} message={errorMessage} onRetry={onRetry} />
      ) : null}
      {state === 'unavailable' ? (
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      ) : null}
      {state !== 'loading' && state !== 'error' && state !== 'unavailable' ? (
        <TableMessage title={emptyTitle} message={emptyDescription} action={emptyAction} />
      ) : null}
    </>
  );
}
