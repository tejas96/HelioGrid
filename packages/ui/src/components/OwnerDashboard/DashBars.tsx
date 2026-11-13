import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider';
import type { DashBar } from './OwnerDashboard.logic';
import './DashBars.css';

/** A bar's length rides in as a custom property, so the drawing stays in the stylesheet. */
type BarVars = CSSProperties &
  Record<'--hg-owner-bar-share' | '--hg-owner-bar-depth' | '--i', string>;

/**
 * A card's count bars, and an optional foot row closing them below a dashed line on the same columns: each row its words, its rail and its count — the rail an 8 px pill, its fill grown once by transform, the rows one after another. The words and the count
 * carry the fact; the rail only shows its size.
 */
export function DashBars({ bars, foot }: { bars: readonly DashBar[]; foot?: DashBar }) {
  const rows = foot === undefined ? bars : [...bars, foot];
  const format = useFormat();
  return (
    <ul className="hg-owner-bars">
      {rows.map((bar, index) => {
        const vars: BarVars = {
          '--hg-owner-bar-share': String(bar.share),
          '--hg-owner-bar-depth': String(bar.depth),
          '--i': String(Math.min(index, 8)),
        };
        return (
          <li key={bar.key} className="hg-owner-bar" data-foot={bar === foot ? 'true' : undefined}>
            <span className="hg-owner-bar-label">{bar.label}</span>
            <span className="hg-owner-bar-rail" aria-hidden="true">
              <span className="hg-owner-bar-fill" data-tone={bar.tone} style={vars} />
            </span>
            <span className="hg-owner-bar-count">{format.number(bar.count)}</span>
          </li>
        );
      })}
    </ul>
  );
}
