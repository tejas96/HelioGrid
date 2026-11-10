import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Avatar } from '../Avatar/Avatar.native';
import { ListRow } from '../ListRow/ListRow.native';
import { Sheet } from '../Sheet/Sheet.native';
import { AssigneeLoad } from './AssigneeLoad.native';
import { isAssignWaiting, loadSharesOf, pickOf } from './AssignPicker.logic';
import type { AssignPickerProps } from './AssignPicker.types';

/**
 * THE assign picker (`M02-28`, `M02-29`) — one list for the inbox and lead detail alike: each
 * person's face, name, open and overdue counts and load bar, and one tap picks with no confirm.
 * While the caller's assign waits, its line sits in that person's row and nothing else moves —
 * neither a drag, the backdrop nor Android's Back closes the sheet.
 */
export function AssignPicker({
  open,
  onClose,
  read,
  people,
  ownerId,
  readerId,
  onPick,
  pending,
  words,
}: AssignPickerProps) {
  const shares = loadSharesOf(people);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      title={words.title}
      subtitle={words.subtitle}
      dismissible={!isAssignWaiting(pending)}
      read={read}
      loadingLabel={words.loading}
      errorTitle={words.failedTitle}
      errorMessage={words.failedMessage}
      retryLabel={words.retry}
      emptyTitle={words.emptyTitle}
      emptyMessage={words.emptyMessage}
    >
      <View style={styles.list}>
        {people.map((person) => (
          <ListRow
            key={person.userId}
            avatar={<Avatar name={person.name} size={40} />}
            title={person.userId === readerId ? words.you(person.name) : person.name}
            marks={
              <AssigneeLoad
                openCount={person.openCount}
                overdueCount={person.overdueCount}
                share={shares.get(person.userId) ?? 0}
                words={words}
              />
            }
            trailing={
              person.userId === ownerId ? (
                <StatusMark tone="accent" label={words.holds} />
              ) : undefined
            }
            pending={pending?.userId === person.userId ? pending.line : undefined}
            onClick={pickOf(person, ownerId, pending, onPick)}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-0-5'] },
});
