import { LeadActSheet } from '../LeadActSheet';
import { leadActSheetOf } from './LeadDetailSheet.logic';
import type { LeadDetailSheetProps } from './LeadDetailSheet.types';

/** On the web: below the editor breakpoint a sheet, above it a decision centred over the page. */
export function LeadDetailSheet(props: LeadDetailSheetProps) {
  return <LeadActSheet {...leadActSheetOf(props)} />;
}
