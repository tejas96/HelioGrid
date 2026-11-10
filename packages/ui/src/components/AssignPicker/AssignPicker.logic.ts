import type { AssignPickerPending, AssignPickerPerson } from './AssignPicker.types';

/**
 * Each person's open leads as a share of the busiest person's, so the bars compare the team at a
 * glance. With nobody holding a lead every bar is empty, never divided by nought.
 */
export function loadSharesOf(people: readonly AssignPickerPerson[]): ReadonlyMap<string, number> {
  const busiest = Math.max(0, ...people.map((person) => person.openCount));
  return new Map(
    people.map((person) => [person.userId, busiest === 0 ? 0 : person.openCount / busiest]),
  );
}

/** An assign is out and unanswered: every row and every way out waits for it. */
export function isAssignWaiting(pending: AssignPickerPending | null): boolean {
  return pending !== null && pending.line.state !== 'returned';
}

/** What a tap on a row does: picks the person, unless an assign waits or they hold it already. */
export function pickOf(
  person: AssignPickerPerson,
  ownerId: string | null,
  pending: AssignPickerPending | null,
  onPick: (userId: string) => void,
): () => void {
  return () => {
    if (isAssignWaiting(pending) || person.userId === ownerId) return;
    onPick(person.userId);
  };
}
