import { ActivityStream } from '../ActivityStream/ActivityStream.native';
import { useFormat } from '../MarketProvider';
import { leadTimelineStreamOf } from './LeadTimeline.logic';
import type { LeadTimelineProps } from './LeadTimeline.types';

/** The timeline on the phone: the stream's functional density, a tighter line for one hand. */
export function LeadTimeline<Entry>(props: LeadTimelineProps<Entry>) {
  const format = useFormat();
  return <ActivityStream {...leadTimelineStreamOf(props, format)} density="functional" />;
}
