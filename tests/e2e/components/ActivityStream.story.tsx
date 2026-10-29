import {
  ACTIVITY_STREAM,
  activityStreamWords,
  actorClassWords,
  createTranslator,
} from '@heliogrid/i18n';
import { ActivityStream, type ActivityStreamProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = activityStreamWords(en.t, actorClassWords(en.t));

/**
 * `ActivityStream` with its words bound in the browser: `kind`, `count` and `showMore` are
 * functions the stream calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedActivityStream(
  props: Pick<ActivityStreamProps, 'read' | 'entries' | 'todayLabel' | 'groupBy'>,
) {
  return (
    <ActivityStream
      {...props}
      words={words}
      countLabel={en.t(ACTIVITY_STREAM.countLabel)}
      yesterdayLabel={en.t(ACTIVITY_STREAM.yesterday)}
      emptyTitle={en.t(ACTIVITY_STREAM.emptyTitle)}
      filteredEmptyTitle={en.t(ACTIVITY_STREAM.filteredEmptyTitle)}
      errorTitle={en.t(ACTIVITY_STREAM.errorTitle)}
      unavailableTitle={en.t(ACTIVITY_STREAM.unavailableTitle)}
    />
  );
}
