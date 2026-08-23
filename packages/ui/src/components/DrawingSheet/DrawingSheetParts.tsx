import { useFormat } from '../MarketProvider';
import type { DrawingTitleBlock, SheetSymbol } from './DrawingSheet.types';

export function NorthMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="North"
      role="img"
      className="hg-drawing-sheet-north-mark"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M12 4v11" />
      <path d="m9 7 3-3 3 3" />
    </svg>
  );
}

/** MS8-17: read only when a drawing exists, so an empty slot produces no legend. */
export function Legend({ symbols }: { symbols?: SheetSymbol[] }) {
  if (!symbols || symbols.length === 0) return null;
  return (
    <div data-keep-together="">
      <p className="hg-drawing-sheet-overline">Legend</p>
      <ul className="hg-drawing-sheet-legend">
        {symbols.map((s) => (
          <li className="hg-drawing-sheet-legend-row" key={s.code ?? s.label}>
            <span aria-hidden="true" className="hg-drawing-sheet-legend-glyph">
              {s.glyph || (
                <span
                  className="hg-drawing-sheet-legend-mark"
                  data-shape={s.shape ?? 'square'}
                  style={s.mark ? { background: s.mark } : undefined}
                />
              )}
            </span>
            {s.code && <span className="hg-drawing-sheet-legend-code">{s.code}</span>}
            <span className="hg-drawing-sheet-legend-label">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TitleBlockPanelProps {
  tb: DrawingTitleBlock;
  scale: string;
  drawingLabel: string;
  /** The paper's own words — "A4", cut from the geometry label. */
  paperLabel: string;
}

/** The title block is a BAND, not a ruled box — this system has no structural borders. */
export function TitleBlockPanel({ tb, scale, drawingLabel, paperLabel }: TitleBlockPanelProps) {
  const mkt = useFormat();
  const cells: [string, string | undefined][] = [
    ['Drawing no.', tb.drawingNumber],
    ['Revision', tb.revision],
    ['Scale', scale],
    ['Paper', paperLabel],
    ['Issued', tb.issueDate ? mkt.date(tb.issueDate) : undefined],
    ['Drawn by', tb.drawnBy],
    ['Checked', tb.checkedBy],
  ];
  return (
    <>
      <div data-keep-together="">
        <p className="hg-drawing-sheet-overline">{tb.project ? 'Project' : 'Drawing'}</p>
        <p className="hg-drawing-sheet-title">{tb.project || tb.drawingTitle || drawingLabel}</p>
        {tb.project && tb.drawingTitle && (
          <p className="hg-drawing-sheet-subtitle">{tb.drawingTitle}</p>
        )}
        {tb.client && <p className="hg-drawing-sheet-client">{tb.client}</p>}
      </div>
      <div className="hg-drawing-sheet-fields">
        {cells
          .filter((cell): cell is [string, string] => Boolean(cell[1]))
          .map(([key, value]) => (
            <div key={key}>
              <p className="hg-drawing-sheet-overline">{key}</p>
              <p className="hg-drawing-sheet-value">{value}</p>
            </div>
          ))}
      </div>
    </>
  );
}
