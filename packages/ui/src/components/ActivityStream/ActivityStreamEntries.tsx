import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider';
import { sortEntries } from './ActivityStream.kinds';
import { streamMarkOf } from './ActivityStream.logic';
import type { StreamEntriesProps } from './ActivityStream.types';
import { ActivityStreamList } from './ActivityStreamList';

/**
 * A few entries in the stream's own frame and list: its circle size, its day headings, its entry —
 * every entry given, so no count line and no *Show more*.
 */
export function StreamEntries({
  entries,
  kinds,
  words,
  density,
  todayLabel,
  yesterdayLabel,
  countLabel,
}: StreamEntriesProps) {
  const format = useFormat();
  const sorted = sortEntries(entries, 'newest');
  const list = (
    <ActivityStreamList
      sorted={sorted}
      shown={sorted.length}
      total={sorted.length}
      reveal={() => {}}
      format={format}
      kinds={kinds}
      groupBy="day"
      step={sorted.length}
      hasMore={false}
      loadingMore={false}
      filtered={false}
      countLabel={countLabel}
      todayLabel={todayLabel}
      yesterdayLabel={yesterdayLabel}
      density={density}
      words={words}
    />
  );
  const circle = { '--hg-stream-circle': `${streamMarkOf(density).circle}px` } as CSSProperties;
  return (
    <div className="hg-stream" data-density={density} style={circle}>
      {list}
    </div>
  );
}
