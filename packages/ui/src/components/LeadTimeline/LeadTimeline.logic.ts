import type { TranslatedText } from '@heliogrid/contracts';
import { ACTIVITY_KINDS, type ActivityKind } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type {
  ActivityKindLook,
  ActivityKindSpec,
  ActivityStreamProps,
} from '../ActivityStream/ActivityStream.types';
import type { LeadTimelineProps } from './LeadTimeline.types';

/**
 * How each CRM timeline kind looks in `ActivityStream` (`M02-35`): a tone and one of the stream's
 * own glyphs. A kind a newer server learned is drawn as the stream's plain `system` entry.
 */
export const LEAD_ACTIVITY_LOOK: Record<ActivityKind, ActivityKindLook> = {
  lead_created: { tone: 'accent', glyph: 'flag' },
  note: { tone: 'neutral', glyph: 'note' },
  call: { tone: 'accent', glyph: 'phone' },
  enquiry: { tone: 'info', glyph: 'bell' },
  stage_change: { tone: 'success', glyph: 'check' },
  state_change: { tone: 'warning', glyph: 'flag' },
  assignment: { tone: 'neutral', glyph: 'user' },
  field_change: { tone: 'neutral', glyph: 'note' },
  duplicate_kept: { tone: 'warning', glyph: 'link' },
  referral: { tone: 'info', glyph: 'link' },
  message_copied: { tone: 'neutral', glyph: 'doc' },
  visit_booked: { tone: 'success', glyph: 'clipboard' },
  visit_rescheduled: { tone: 'warning', glyph: 'clipboard' },
  task_done: { tone: 'success', glyph: 'check' },
  customer_merged: { tone: 'neutral', glyph: 'user' },
};

/** The stream's registry for the CRM's kinds, each named in the reader's words. */
export function leadActivityKinds(
  label: Readonly<Record<ActivityKind, TranslatedText>>,
): Record<string, ActivityKindSpec> {
  return Object.fromEntries(
    ACTIVITY_KINDS.map((kind) => [kind, { ...LEAD_ACTIVITY_LOOK[kind], label: label[kind] }]),
  );
}

/** The stream both halves draw: the read's entries in the reader's words, a page at a time. */
export function leadTimelineStreamOf<Entry>(
  { timeline, words }: LeadTimelineProps<Entry>,
  format: MarketFormat,
): Omit<ActivityStreamProps, 'density'> {
  const { read } = timeline;
  const formats = { day: format.date, time: format.time, money: format.money };
  return {
    entries: read.kind === 'ready' ? words.entries(read.value, formats) : [],
    kinds: leadActivityKinds(words.kind),
    total: timeline.total,
    hasMore: timeline.hasMore,
    onLoadMore: timeline.loadMore,
    loadingMore: timeline.loadingMore,
    read,
    ...words.stream,
  };
}
