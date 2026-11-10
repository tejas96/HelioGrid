import type { AssignPickerPerson } from '../AssignPicker/AssignPicker.types';
import type { TeamDockLayout } from './TeamDock.types';

/**
 * The faces each layout has room for before the last one opens the whole team: five across a
 * phone's card at 375, two rows of six on the stage. Beyond, the picker lists everyone.
 */
const ROOM: Record<TeamDockLayout, number> = { faces: 5, tiles: 12 };

/** The faces drawn, and whether an "All" face closes the row because some did not fit. */
export function dockedOf(
  people: readonly AssignPickerPerson[],
  layout: TeamDockLayout,
): { readonly shown: readonly AssignPickerPerson[]; readonly overflows: boolean } {
  const room = ROOM[layout];
  if (people.length <= room) return { shown: people, overflows: false };
  return { shown: people.slice(0, room - 1), overflows: true };
}

/** A face's short name under it: the first word of the name, as the person wrote it. */
export function shortNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** The grid's columns on the stage: the faces and the "All" face, six at most to a row. */
export function dockColumnsOf(shown: number, overflows: boolean): number {
  return Math.max(1, Math.min(shown + (overflows ? 1 : 0), ROOM.tiles / 2));
}

/** The digits give to the first nine faces on the stage (`SCR-M02-02`'s keys). */
export const KEYED_FACES = 9;
