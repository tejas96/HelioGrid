import { ActivityStream } from '../ActivityStream';
import { useFormat } from '../MarketProvider';
import { leadTimelineStreamOf } from './LeadTimeline.logic';
import type { LeadTimelineProps } from './LeadTimeline.types';

/** The timeline at the stream's own density, with room on the page for its full line. */
export function LeadTimeline<Entry>(props: LeadTimelineProps<Entry>) {
  const format = useFormat();
  return <ActivityStream {...leadTimelineStreamOf(props, format)} />;
}
