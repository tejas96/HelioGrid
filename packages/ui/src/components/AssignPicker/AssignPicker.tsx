import { StatusMark } from '../../primitives/StatusMark';
import { Avatar } from '../Avatar';
import { ListRow } from '../ListRow';
import { Sheet } from '../Sheet';
import { AssigneeLoad } from './AssigneeLoad';
import { isAssignWaiting, loadSharesOf, pickOf } from './AssignPicker.logic';
import type { AssignPickerProps } from './AssignPicker.types';

/**
 * THE assign picker (`M02-28`, `M02-29`) — one list for the inbox and lead detail alike: each
 * person's face, name, open and overdue counts and load bar, and one tap picks with no confirm.
 * While the caller's assign waits, its line sits in that person's row and nothing else moves; the
 * sheet focuses its panel, named by the title, and gives focus back to what opened it.
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
      showClose
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
      <div className="hg-assign-picker">
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
      </div>
    </Sheet>
  );
}
