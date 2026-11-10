import { AssignPicker } from '../AssignPicker/AssignPicker';
import { actConfirmLayersOf } from './MemberCard.reassign';
import type { TeamActConfirmProps } from './MemberCard.types';
import { TeamConfirm } from './TeamConfirm';

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
