import type { TranslatedText } from '@heliogrid/contracts';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { useFormat } from '../MarketProvider';
import type { DrawingSheetWords, DrawingTitleBlock, SheetSymbol } from './DrawingSheet.types';

export function NorthMark({ name, size = 34 }: { name: TranslatedText; size?: number }) {
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
      aria-label={name}
      role="img"
      className="hg-drawing-sheet-north-mark"
    >
      <g opacity="0.25">
        <ShellGlyphMarks name="ring" />
      </g>
      <ShellGlyphMarks name="arrow-north" />
    </svg>
  );
}

/** MS8-17: read only when a drawing exists, so an empty slot produces no legend. */
export function Legend({ symbols, title }: { symbols?: SheetSymbol[]; title: TranslatedText }) {
  if (!symbols || symbols.length === 0) return null;
  return (
    <div data-keep-together="">
      <p className="hg-drawing-sheet-overline">{title}</p>
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
  drawingLabel: TranslatedText;
  /** The paper's standard name — "A4", cut from the geometry label. */
  paperLabel: string;
  words: DrawingSheetWords;
}

/** The title block is a BAND, not a ruled box — this system has no structural borders. */
export function TitleBlockPanel({
  tb,
  scale,
  drawingLabel,
  paperLabel,
  words,
}: TitleBlockPanelProps) {
  const mkt = useFormat();
  const cells: [TranslatedText, string | undefined][] = [
    [words.drawingNumber, tb.drawingNumber],
    [words.revision, tb.revision],
    [words.scale, scale],
    [words.paper, paperLabel],
    [words.issued, tb.issueDate ? mkt.date(tb.issueDate) : undefined],
    [words.drawnBy, tb.drawnBy],
    [words.checked, tb.checkedBy],
  ];
  return (
    <>
      <div data-keep-together="">
        <p className="hg-drawing-sheet-overline">{tb.project ? words.project : words.drawing}</p>
        <p className="hg-drawing-sheet-title">{tb.project || tb.drawingTitle || drawingLabel}</p>
        {tb.project && tb.drawingTitle && (
          <p className="hg-drawing-sheet-subtitle">{tb.drawingTitle}</p>
        )}
        {tb.client && <p className="hg-drawing-sheet-client">{tb.client}</p>}
      </div>
      <div className="hg-drawing-sheet-fields">
        {cells
          .filter((cell): cell is [TranslatedText, string] => Boolean(cell[1]))
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
