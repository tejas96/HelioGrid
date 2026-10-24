import type { ReactNode } from 'react';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { DataTableColumn } from './DataTableColumn.types';

/**
 * **The record's kind tile before the value, and its quiet line under it** (`D268`). Both belong
 * to the cell, so they reach every form the cell is drawn in — the row's primary cell and the
 * card's title alike. A cell asking for neither is its value alone: no box is drawn around
 * content that is absent.
 */
export function CellLead<Row>({
  row,
  column,
  children,
}: {
  row: Row;
  column: DataTableColumn<Row>;
  children: ReactNode;
}) {
  const leading = column.leading?.(row) ?? null;
  const sub = column.sub?.(row) ?? null;
  if (leading === null && sub === null) return children;

  return (
    <span className="hg-dt-lead">
      {leading === null ? null : (
        /* The kind is said in the words beside it; the tile is its second channel. */
        <span className="hg-dt-lead-tile hg-iris" data-iris={leading.iris} aria-hidden="true">
          <svg
            aria-hidden="true"
            width={ICON_SIZE.md}
            height={ICON_SIZE.md}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ShellGlyphMarks name={leading.glyph} />
          </svg>
        </span>
      )}
      <span className="hg-dt-lead-text">
        <span className="hg-dt-lead-value">{children}</span>
        {sub === null ? null : <span className="hg-dt-sub">{sub}</span>}
      </span>
    </span>
  );
}
