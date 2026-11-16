import { useFocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { ComplianceFloor } from '../ComplianceFloor';
import { ValueSource } from '../ValueSource';
import { dateRowReading } from './DateSet.logic';
import type { DateSetRowProps } from './DateSet.types';
import { floorFor } from './date-set-floor';

/** One date. Deletability follows origin: a tenant row has a 44px delete, a pack row has the floor. */
export function DateSetRow({
  entry,
  mkt,
  packName,
  floor,
  words,
  floorWords,
  blocked,
  density,
  onRemove,
  focusAfter,
}: DateSetRowProps) {
  const row = dateRowReading({ entry, mkt, packName, words, onRemove });
  const leaving = useFocusAfter(focusAfter);
  return (
    <li
      className="hg-date-set-row"
      data-density={density}
      data-blocked={blocked ? 'true' : undefined}
    >
      <div className="hg-date-set-row-body">
        <span className="hg-date-set-row-head">
          <span className="hg-date-set-row-date">{row.date}</span>
          <span className="hg-date-set-row-weekday">{row.weekday}</span>
        </span>
        {entry.name === undefined ? null : (
          <span className="hg-date-set-row-name">{entry.name}</span>
        )}
        {/* ORIGIN AS PERSISTENT CONTENT — never a tone and never a tooltip (`F8-07`). It is the
            same which-layer-supplied-this the rates panel renders, so it is the same component:
            `inherited` · "India market pack" against `own` · "Added by you". */}
        <ValueSource {...row.origin} />
        {/* Deletability follows origin: the floor takes the delete's place. */}
        {row.pack ? (
          <ComplianceFloor {...floorFor(entry, packName, floor, words, floorWords)} />
        ) : null}
      </div>
      {row.remove === null ? null : (
        <button
          type="button"
          className="hg-date-set-delete"
          aria-label={words.remove(row.spoken)}
          onClick={leaving(row.remove)}
        >
          <ShellGlyph name="trash" size="sm" tone="current" />
        </button>
      )}
    </li>
  );
}
