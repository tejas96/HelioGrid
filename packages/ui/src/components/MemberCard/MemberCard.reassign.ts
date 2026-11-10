import type { AssignPickerProps } from '../AssignPicker/AssignPicker.types';
import type { TeamActConfirmProps, TeamConfirmProps } from './MemberCard.types';

/**
 * `TeamActConfirm`'s two layers from one set of facts, for both halves: the confirm — shut while
 * the picker is open, carrying the open work when a deactivation asks — and the picker.
 */
export function actConfirmLayersOf({
  reassign,
  reassignWords,
  pickerWords,
  words,
  ...confirm
}: TeamActConfirmProps): { confirm: TeamConfirmProps; picker: AssignPickerProps } {
  const { open } = reassign;
  return {
    confirm: {
      ...confirm,
      words: reassign.picking ? null : words,
      ...(open === null
        ? {}
        : {
            reassign: {
              read: open,
              to: reassign.to?.name ?? null,
              onChoose: reassign.choose,
              words: reassignWords,
            },
          }),
    },
    picker: {
      open: reassign.picking,
      onClose: reassign.closePicker,
      read: reassign.peopleRead,
      people: reassign.people,
      ownerId: null,
      readerId: null,
      onPick: reassign.pick,
      pending: null,
      words: pickerWords,
    },
  };
}
