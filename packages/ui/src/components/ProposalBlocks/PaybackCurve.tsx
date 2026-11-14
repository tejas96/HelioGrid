import { type CSSProperties, useId } from 'react';
import { PAYBACK_BOX, type PaybackGeometry } from './ProposalBlocks.logic';

type PlotVars = CSSProperties & Record<`--${string}`, string>;

/**
 * The savings curve against the net cost: a wash under the line, the net cost as a dashed rule, and
 * a ring where the two cross. A computed plot, drawn in its own units and scaled to its column; the
 * line draws itself once. Its words are set outside the drawing, at the page's own type size — a
 * word scaled with a plot falls under the 12 px floor on a phone.
 */
export function PaybackCurve({
  geometry,
  name,
  netCost,
  firstYear,
  lastYear,
}: {
  geometry: PaybackGeometry;
  name: string;
  netCost: string;
  firstYear: string;
  lastYear: string;
}) {
  const wash = useId();
  const { width, height } = PAYBACK_BOX;
  const vars: PlotVars = { '--hg-pb-net': `${(1 - geometry.netY / height) * 100}%` };
  return (
    <div className="hg-pb-payback-plot">
      <div className="hg-pb-payback-box" style={vars}>
        <svg
          className="hg-pb-payback-drawing"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={name}
        >
          <defs>
            <linearGradient id={wash} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="hg-pb-payback-wash" stopOpacity="0.28" />
              <stop offset="1" className="hg-pb-payback-wash" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={geometry.washPoints} fill={`url(#${wash})`} />
          <polyline className="hg-pb-payback-line" points={geometry.curvePoints} pathLength={1} />
          <line
            className="hg-pb-payback-net"
            x1="0"
            x2={width}
            y1={geometry.netY}
            y2={geometry.netY}
          />
          {geometry.crossX === null ? null : (
            <circle className="hg-pb-payback-cross" cx={geometry.crossX} cy={geometry.netY} r="6" />
          )}
        </svg>
        <span className="hg-pb-payback-net-word">{netCost}</span>
      </div>
      <div className="hg-pb-payback-axis" aria-hidden="true">
        <span>{firstYear}</span>
        <span>{lastYear}</span>
      </div>
    </div>
  );
}
