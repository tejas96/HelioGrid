import type {
  AssignPickerPending,
  AssignPickerPerson,
  AssignPickerProps,
} from '../AssignPicker/AssignPicker.types';
import type { LeadAssignPickerProps } from './LeadAssignPicker.types';

/** The assign out, on the picked person's row; else the one that came back undone, saying why. */
function pendingOf(
  { assign, words }: LeadAssignPickerProps,
  people: readonly AssignPickerPerson[],
): AssignPickerPending | null {
  const { pendingUserId, returned } = assign;
  if (pendingUserId !== null) {
    const name = people.find((person) => person.userId === pendingUserId)?.name ?? '';
    return { userId: pendingUserId, line: { label: words.assigning(name) } };
  }
  if (returned === null) return null;
  const reason =
    returned.kind === 'already_assigned'
      ? words.alreadyAssigned(returned.owner?.name ?? null)
      : words.failure(returned.failure);
  return { userId: returned.userId, line: { state: 'returned', reason } };
}

/** The one assign picker, opened from the lead's owner chip (`M02-29`). */
export function leadAssignPickerPropsOf(props: LeadAssignPickerProps): AssignPickerProps {
  const { assign, ownerId, words } = props;
  const people = assign.people.kind === 'ready' ? assign.people.value : [];
  return {
    open: assign.open,
    onClose: assign.hide,
    read: assign.people,
    people,
    ownerId,
    readerId: assign.readerId,
    onPick: assign.pick,
    pending: pendingOf(props, people),
    words: words.picker,
  };
}
