import { LeadActSheet } from '../LeadActSheet/LeadActSheet.native';
import { leadActSheetOf } from './LeadDetailSheet.logic';
import type { LeadDetailSheetProps } from './LeadDetailSheet.types';

/** On the phone: the sheet over the page, waiting on its drag, backdrop and Back while it sends. */
export function LeadDetailSheet(props: LeadDetailSheetProps) {
  return <LeadActSheet {...leadActSheetOf(props)} />;
}
