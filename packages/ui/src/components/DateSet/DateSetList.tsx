import type { ComplianceFloorSpec } from '../ComplianceFloor';
import type { MarketFormat } from '../DatePicker/DatePicker.types';
import type { DateSetEntry } from './DateSet.types';
import { DateSetRow } from './DateSetRow';

interface DateSetListProps {
  entries: DateSetEntry[];
  mkt: MarketFormat;
  packName: string;
  floor: ComplianceFloorSpec | undefined;
  listLabel: string;
  emptyMessage: string;
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
  listLabel,
  emptyMessage,
  blocked,
  density,
  onRemove,
}: DateSetListProps) {
  return (
    <div className="hg-date-set-list">
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
              blocked={blocked === entry.date}
              density={density}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
