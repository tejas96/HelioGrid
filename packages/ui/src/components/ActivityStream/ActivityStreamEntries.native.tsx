import { useFormat } from '../MarketProvider';
import { sortEntries } from './ActivityStream.kinds';
import type { StreamEntriesProps } from './ActivityStream.types';
import { ActivityStreamList } from './ActivityStreamList.native';

/**
 * A few entries as the stream draws them on the phone: its day headings and its entry — every entry
 * given, so no count line and no *Show more*.
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
  return list;
}
