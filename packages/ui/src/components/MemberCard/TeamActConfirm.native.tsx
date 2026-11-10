/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { AssignPicker } from '../AssignPicker/AssignPicker.native';
import { actConfirmLayersOf } from './MemberCard.reassign';
import type { TeamActConfirmProps } from './MemberCard.types';
import { TeamConfirm } from './TeamConfirm.native';

/** A row act's confirm and, for a deactivation, the picker choosing who takes the open leads (`SCR-M01-12`). */
export function TeamActConfirm(props: TeamActConfirmProps) {
  const { confirm, picker } = actConfirmLayersOf(props);
  return (
    <>
      <TeamConfirm {...confirm} />
      <AssignPicker {...picker} />
    </>
  );
}
