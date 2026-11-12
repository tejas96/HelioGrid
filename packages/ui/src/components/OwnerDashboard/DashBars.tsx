import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider';
import type { DashBar } from './OwnerDashboard.logic';
import './DashBars.css';

/** A bar's length rides in as a custom property, so the drawing stays in the stylesheet. */
type BarVars = CSSProperties & Record<'--hg-owner-bar-share' | '--i', string>;

/**
 * A card's count bars: each row its words, its rail and its count — the rail the progress bar's
 * 6 px pill, its fill grown once by transform, the rows one after another. The words and the count
 * carry the fact; the rail only shows its size.
 */
export function DashBars({ bars }: { bars: readonly DashBar[] }) {
  const format = useFormat();
  return (
    <ul className="hg-owner-bars">
      {bars.map((bar, index) => {
        const vars: BarVars = {
          '--hg-owner-bar-share': String(bar.share),
          '--i': String(Math.min(index, 8)),
        };
        return (
          <li key={bar.key} className="hg-owner-bar">
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
