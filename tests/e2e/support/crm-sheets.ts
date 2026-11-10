import type { AssignPickerPerson } from '@heliogrid/ui';

/*
 * The facts the CRM sheets' stories mount and their specs assert, kept apart from the stories:
 * the component transform refuses a plain value imported beside a mounted component.
 */

/** The number the capture typed, as the screen shows a phone. */
export const TYPED_PHONE = '+91 98220 41234';

/** A team at the long end: a busy rep with overdue work, a free one, and the reader. */
export const TEAM: readonly AssignPickerPerson[] = [
  { userId: 'rajesh', name: 'Rajesh Jadhav', openCount: 18, overdueCount: 2 },
  { userId: 'neha', name: 'Neha Kulkarni', openCount: 9, overdueCount: 0 },
  { userId: 'me', name: 'Asha Patil', openCount: 0, overdueCount: 0 },
];
