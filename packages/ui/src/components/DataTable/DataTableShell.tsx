import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { UnavailableNote } from '../UnavailableNote';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { DataTableProps, DataTableWords } from './DataTable.types';
import { TableMessage, TableSkeleton } from './DataTableChrome';
import { captionTextOf } from './DataTableChrome.logic';
import { QuietSkeleton } from './DataTableQuiet';

/**
 * **The caption is not inside the `<table>`.** As a `<caption>` element it vanished on every phone
 * and in every narrow panel, so it sits in the shell — above both forms and every state message —
 * and both forms take their accessible name from it (`F7-27`).
 */
export function TableCaption({
  caption,
  continued,
  id,
  spokenOnly = false,
  words,
}: {
  caption: TranslatedText | undefined;
  continued: boolean;
  id: string;
  /** A quiet table's caption names it for a screen reader only (`F7-27` still holds). */
  spokenOnly?: boolean;
  words: DataTableWords;
}) {
  if (caption === undefined) return null;
  return (
    <div className={spokenOnly ? 'hg-spoken-only' : 'hg-dt-caption'} id={id}>
      {captionTextOf(caption, continued, words)}
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
  quiet,
  focusAfter,
}: {
  table: DataTableProps<Row>;
  stacked: boolean;
  quiet: boolean;
  /** The table's frame, which stays while a failed read reloads. */
  focusAfter: FocusAfter;
}) {
  const {
    read,
    emptyTitle,
    emptyDescription,
    emptyAction,
    errorTitle,
    errorMessage,
    retryLabel,
    unavailableTitle,
    unavailableMessage,
    words,
  } = table;
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);

  return (
    <>
      {state === 'loading' && quiet ? <QuietSkeleton table={table} /> : null}
      {state === 'loading' && !quiet ? (
        <TableSkeleton stacked={stacked} label={words.loading} />
      ) : null}
      {state === 'error' ? (
        <TableMessage
          tone="warning"
          title={errorTitle}
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={focusAfter}
        />
      ) : null}
      {state === 'unavailable' ? (
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      ) : null}
      {state !== 'loading' && state !== 'error' && state !== 'unavailable' ? (
        <TableMessage
          title={emptyTitle}
          message={emptyDescription}
          action={emptyAction}
          focusAfter={focusAfter}
        />
      ) : null}
    </>
  );
}
