import { AssignPicker } from '../AssignPicker/AssignPicker.native';
import { leadAssignPickerPropsOf } from './LeadAssignPicker.logic';
import type { LeadAssignPickerProps } from './LeadAssignPicker.types';

/** The lead's picker on the phone: the assign picker's own sheet, this lead's owner marked. */
export function LeadAssignPicker(props: LeadAssignPickerProps) {
  return <AssignPicker {...leadAssignPickerPropsOf(props)} />;
}
