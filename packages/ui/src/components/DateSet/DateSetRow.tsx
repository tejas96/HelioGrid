import type { ComplianceFloorSpec } from '../ComplianceFloor';
import { ComplianceFloor } from '../ComplianceFloor';
import { weekdayOf } from '../DatePicker/calendar-grid';
import type { MarketFormat } from '../DatePicker/DatePicker.types';
import { ValueSource } from '../ValueSource';
import type { DateSetEntry } from './DateSet.types';
import { floorFor } from './date-set-floor';

export interface DateSetRowProps {
  entry: DateSetEntry;
  mkt: MarketFormat;
  packName: string;
  floor: ComplianceFloorSpec | undefined;
  /** True while this row's removal is the one that was just refused. */
  blocked: boolean;
  density: 'expressive' | 'functional';
  onRemove?: (date: string, spokenName: string) => void;
}

/** One date. Deletability follows origin: a tenant row has a 44px delete, a pack row has the floor. */
export function DateSetRow({
  entry,
  mkt,
  packName,
  floor,
  blocked,
  density,
  onRemove,
}: DateSetRowProps) {
  const d = new Date(`${entry.date}T00:00:00`);
  const pack = entry.origin === 'pack';
  const spoken = entry.name ?? mkt.date(d);
  return (
    <li
      className="hg-date-set-row"
      data-density={density}
      data-blocked={blocked ? 'true' : undefined}
    >
      <div className="hg-date-set-row-body">
        <span className="hg-date-set-row-head">
          <span className="hg-date-set-row-date">{mkt.date(d)}</span>
          <span className="hg-date-set-row-weekday">
            {weekdayOf(d, mkt.weekdayNames('long'), mkt.firstDayOfWeek)}
          </span>
        </span>
        {entry.name === undefined ? null : (
          <span className="hg-date-set-row-name">{entry.name}</span>
        )}
        {/* ORIGIN AS PERSISTENT CONTENT — never a tone and never a tooltip (`F8-07`). It is the
            same which-layer-supplied-this the rates panel renders, so it is the same component:
            `inherited` · "India market pack" against `own` · "Added by you". */}
        <ValueSource
          level={pack ? 'inherited' : 'own'}
          layerName={pack ? packName : 'Added by you'}
          source={pack ? 'Market holiday' : (entry.addedBy ?? 'Tenant holiday')}
        />
        {/* Deletability follows origin: the floor takes the delete's place. */}
        {pack ? <ComplianceFloor {...floorFor(entry, packName, floor)} /> : null}
      </div>
      {!pack && onRemove !== undefined ? (
        <button
          type="button"
          className="hg-date-set-delete"
          aria-label={`Remove ${spoken}`}
          onClick={() => onRemove(entry.date, spoken)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
          </svg>
        </button>
      ) : null}
    </li>
  );
}
