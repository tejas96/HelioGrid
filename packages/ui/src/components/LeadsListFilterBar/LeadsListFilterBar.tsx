import { ListTop } from '../ListTop';
import { leadsListTopOf } from './LeadsListFilterBar.logic';
import type { LeadsListFilterBarProps } from './LeadsListFilterBar.types';

/** The Leads list's top on the web: the shared list top, filled from the list's screen. */
export function LeadsListFilterBar(props: LeadsListFilterBarProps) {
  return <ListTop {...leadsListTopOf(props)} />;
}
