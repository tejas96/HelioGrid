/* DrawingSheet — THE SECOND KIND OF SHEET, and it is not a proposal page with a picture on it.

   MS9-03's drawing pages and MS8-02 describe a drafting sheet: "paper size, scale and sheet
   numbering consistent across every sheet AND TITLE BLOCK", "zoom either works or is not
   advertised". MS8-08: "the structural disclaimer travels on EVERY sheet". MS8-17: "the legend
   lists ONLY symbols the sheet actually renders".

   Four of those are enforced here rather than remembered by a caller:

     · CONSISTENCY IS THE GROUP'S JOB — DrawingSheetGroup counts its children and hands each one
       the same paper, orientation, scale and shared title-block fields.
     · THE DISCLAIMER CANNOT BE TURNED OFF — there is no `disclaimer={false}`: the prop replaces
       the WORDS and never the presence.
     · THE LEGEND IS DERIVED FROM WHAT IS DRAWN — `symbols` is read only when a `drawing` exists.
     · ZOOM IS EITHER REAL OR ABSENT — the controls render only when `zoom.onChange` is supplied.

   NO SHEET BORDER. A drafting frame is the convention and it is still a structural border, which
   this system does not have. The sheet separates from the canvas by luminance and shadow like
   every other surface, the drawing area is very slightly sunken, and the title block is a band. */
import { type CSSProperties, useContext } from 'react';
import { classNames } from '../../primitives/class-names';
import { PageSizeOwnerContext, usePageSize } from '../../utils/page-size';
import { renderDisclosure } from '../Disclosure';
import { pageGeometry } from '../PagedDocument/page-geometry';
import type { DrawingSheetProps } from './DrawingSheet.types';
import { DrawingSheetGroup } from './DrawingSheetGroup';
import { Legend, NorthMark, TitleBlockPanel } from './DrawingSheetParts';
import { ZoomControls } from './DrawingSheetZoom';

interface WebDrawingSheetProps extends DrawingSheetProps {
  className?: string;
  style?: CSSProperties;
}

function DrawingSheetRoot({
  paper = 'a4',
  orientation = 'landscape',
  margin = 32,
  scale = '1:100',
  sheet = 1,
  sheets = 1,
  titleBlock,
  drawing,
  drawingLabel = 'Single-line diagram',
  symbols,
  disclaimer,
  north = true,
  zoom,
  className,
  style,
}: WebDrawingSheetProps) {
  const g = pageGeometry({ paper, orientation, margin });
  /* A sheet in a SET does not declare paper — the group does, which is MS8-02's consistency again:
     `@page` is document-level, so a per-sheet declaration would be the last sheet to mount
     winning. A standalone sheet is its own set and declares for itself. */
  const inSet = useContext(PageSizeOwnerContext);
  usePageSize(inSet ? null : { paper, orientation });
  const tb = titleBlock ?? {};
  const legend = drawing ? symbols : undefined;
  const z = zoom?.onChange ? (zoom.value ?? 1) : 1;

  return (
    <div className={classNames('hg-drawing-sheet-frame', className)} style={style}>
      {zoom?.onChange && <ZoomControls zoom={zoom} />}
      <section
        className="hg-sheet hg-drawing-sheet"
        data-screen-label={`Drawing ${sheet}`}
        aria-label={`${tb.drawingTitle || drawingLabel} · sheet ${sheet} of ${sheets}`}
        style={{
          width: g.width,
          height: g.height,
          padding: `${g.margin.top}px ${g.margin.right}px ${g.margin.bottom}px ${g.margin.left}px`,
        }}
      >
        <div className="hg-drawing-sheet-body">
          {/* The drawing area. Sunken rather than ruled — the sheet has no border, by law. */}
          <div className="hg-drawing-sheet-canvas" data-filled={drawing ? 'true' : undefined}>
            {drawing ? (
              <div
                className="hg-drawing-sheet-drawing"
                style={z === 1 ? undefined : { transform: `scale(${z})` }}
              >
                {drawing}
              </div>
            ) : (
              /* THE RESERVATION. The footprint is fixed before the drawing exists, so the sheet
                 does not reflow when it arrives, and it says what belongs here at what scale. */
              <div className="hg-drawing-sheet-reservation">
                <span className="hg-drawing-sheet-reservation-name">
                  {drawingLabel.toLowerCase()} renders here
                </span>
                <span className="hg-drawing-sheet-reservation-meta">
                  {scale} · {g.label}
                </span>
              </div>
            )}
            {north && (
              <span className="hg-drawing-sheet-north">
                <NorthMark />
              </span>
            )}
          </div>

          <aside className="hg-drawing-sheet-block">
            <TitleBlockPanel
              tb={tb}
              scale={scale}
              drawingLabel={drawingLabel}
              paperLabel={g.label.split(' · ')[0] ?? g.label}
            />
            <Legend symbols={legend} />
          </aside>
        </div>

        <div className="hg-drawing-sheet-foot">
          {/* MS8-08: it travels on every sheet, and there is no prop that removes it. */}
          <div className="hg-drawing-sheet-disclaimer">
            {renderDisclosure(disclaimer || { kind: 'structure' }, { surface: 'document' })}
          </div>
          <span className="hg-drawing-sheet-count">
            Sheet {sheet} of {sheets} · {scale}
          </span>
        </div>
      </section>
    </div>
  );
}

/**
 * **The second kind of sheet** (`MS9-03`, `MS8-02`) — a drafting sheet, not a proposal page with a
 * picture on it: paper size, scale and counted numbering in the title block, a legend of exactly
 * what is drawn, and the structural disclaimer on every sheet.
 */
export const DrawingSheet = Object.assign(DrawingSheetRoot, { Group: DrawingSheetGroup });
