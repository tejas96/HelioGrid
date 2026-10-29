import type { TranslatedText } from '@heliogrid/contracts';
import { useRef } from 'react';
import type { ComplianceFloorSpec, ComplianceFloorWords } from '../ComplianceFloor';
import type { MarketFormat } from '../DatePicker/DatePicker.types';
import type { DateSetEntry, DateSetWords } from './DateSet.types';
import { DateSetRow } from './DateSetRow';

interface DateSetListProps {
  entries: DateSetEntry[];
  mkt: MarketFormat;
  packName: string;
  floor: ComplianceFloorSpec | undefined;
  words: DateSetWords;
  floorWords: ComplianceFloorWords;
  listLabel: TranslatedText;
  emptyMessage: TranslatedText;
  /** The date whose removal was just refused — the row it belongs to answers in place. */
  blocked: string | null;
  density: 'expressive' | 'functional';
  onRemove?: (date: string, spokenName: string) => void;
}

/** The list half: an overline, then one row per date in the set. */
export function DateSetList({
  entries,
  mkt,
  packName,
  floor,
  words,
  floorWords,
  listLabel,
  emptyMessage,
  blocked,
  density,
  onRemove,
}: DateSetListProps) {
  /* A removed date takes its row away: focus goes to the list it sat in. */
  const list = useRef<HTMLDivElement>(null);
  return (
    <div ref={list} tabIndex={-1} className="hg-date-set-list hg-focus-target">
      <p className="hg-date-set-overline">{listLabel}</p>
      {entries.length === 0 ? (
        <p className="hg-date-set-empty">{emptyMessage}</p>
      ) : (
        <ul className="hg-date-set-rows">
          {entries.map((entry) => (
            <DateSetRow
              key={entry.date}
              entry={entry}
              mkt={mkt}
              packName={packName}
              floor={floor}
              words={words}
              floorWords={floorWords}
              blocked={blocked === entry.date}
              density={density}
              onRemove={onRemove}
              focusAfter={list}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
