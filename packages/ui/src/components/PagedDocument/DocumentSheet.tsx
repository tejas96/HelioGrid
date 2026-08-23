import type { ReactNode } from 'react';
import type { DocumentAudience, PageGeometry } from './PagedDocument.types';
import { FLOW_GAP, FOOT_H, HEAD_H } from './page-geometry';

interface DocumentSheetProps {
  geometry: PageGeometry;
  /** 0-based. The sheet prints `index + 1`. */
  index: number;
  count: number;
  label: string;
  head: ReactNode;
  audience: DocumentAudience;
  footNote: ReactNode;
  footText: string;
  children: ReactNode;
}

/**
 * One emitted sheet at real paper size. `hg-sheet` is print.css's own hook — one sheet, one page —
 * so the class name stays exactly that. The head, foot and flow gap take their heights from the
 * same constants the cut measures against; a second copy of those numbers in CSS would let the
 * layout and the arithmetic disagree.
 */
export function DocumentSheet({
  geometry,
  index,
  count,
  label,
  head,
  audience,
  footNote,
  footText,
  children,
}: DocumentSheetProps) {
  return (
    <section
      className="hg-sheet hg-paged-document-sheet"
      data-screen-label={`Sheet ${index + 1}`}
      aria-label={`${label} · sheet ${index + 1} of ${count}`}
      style={{
        width: geometry.width,
        height: geometry.height,
        padding: `${geometry.margin.top}px ${geometry.margin.right}px ${geometry.margin.bottom}px ${geometry.margin.left}px`,
      }}
    >
      <div className="hg-paged-document-head" style={{ height: HEAD_H }}>
        <span className="hg-paged-document-head-title">{head}</span>
        {audience === 'internal' && (
          <span className="hg-paged-document-head-internal">Internal copy</span>
        )}
      </div>
      <div className="hg-paged-document-flow" style={{ gap: FLOW_GAP }}>
        {children}
      </div>
      <div className="hg-paged-document-foot" style={{ height: FOOT_H }}>
        <span className="hg-paged-document-foot-note">{footNote}</span>
        {/* COUNTED. `count` is sheets.length; there is no second number to disagree. */}
        <span className="hg-paged-document-foot-number">{footText}</span>
      </div>
    </section>
  );
}
