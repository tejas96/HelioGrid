import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { DENSITY } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { TableMessage, TableSkeleton } from './DataTableFeedback.native';

const styles = StyleSheet.create({
  caption: { paddingTop: 14, paddingHorizontal: theme.spacing['sp-4'] },
});

/**
 * **The caption lives in the shell**, above both forms and every state message, and both forms
 * take their accessible name from it (`F7-27`).
 */
export function TableCaption({
  caption,
  continued,
}: {
  caption: string | undefined;
  continued: boolean;
}) {
  if (caption === undefined) return null;
  return (
    <View style={styles.caption}>
      <Text variant="overline" color="tertiary">
        {`${caption}${continued ? ' (continued)' : ''}`}
      </Text>
    </View>
  );
}

/**
 * **What stands in for the records** when there are none to show. `unavailable` is the fourth
 * state: these records were never going to be here — neutral, and **no retry, ever**. It is
 * `UnavailableNote`'s to render, not a `TableMessage` wearing its words.
 *
 * **The skeleton loads in the form the table will take** — `stacked` decides between the phone's
 * cards and the wide form's header-plus-zebra-rows, so a wide table does not load as cards and
 * then reflow into a grid.
 */
export function TableStates<Row>({
  table,
  stacked,
  density,
}: {
  table: DataTableProps<Row>;
  stacked: boolean;
  density: NonNullable<DataTableProps<Row>['density']>;
}) {
  const spec = DENSITY[density];
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
      {state === 'loading' ? (
        <TableSkeleton stacked={stacked} rowH={spec.rowH} edge={spec.edge} />
      ) : null}
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
