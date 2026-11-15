import type { PointerEvent as ReactPointerEvent } from 'react';

interface SheetHandleProps {
  /** With a header below it the handle takes the roomier bottom padding. */
  hasHeader: boolean;
  /** False when the sheet cannot be dragged away — the bar stays, the grab cursor goes. */
  draggable: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  /** The title the header tucks into this row once the body scrolls; the heading keeps its name. */
  tucked?: string;
}

/**
 * The 36×4 grab bar, and the sheet's drag target.
 *
 * It is a redundant POINTER affordance: Esc, the backdrop and the close button all reach the same
 * dismissal without it, so it carries no keyboard route of its own. Once the body scrolls, the
 * title rests in this row (`tucked`), drawn by the stylesheet with no words of its own, so neither a
 * screen reader nor a search of the page meets the title twice.
 */
export function SheetHandle({ hasHeader, draggable, onPointerDown, tucked }: SheetHandleProps) {
  return (
    <div
      className="hg-sheet-handle"
      data-grab={draggable ? 'true' : 'false'}
      data-header={hasHeader ? 'true' : 'false'}
      data-tucked={tucked}
      onPointerDown={onPointerDown}
    >
      <div className="hg-sheet-handle-bar" />
    </div>
  );
}
