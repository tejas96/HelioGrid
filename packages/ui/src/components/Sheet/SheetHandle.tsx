import type { PointerEvent as ReactPointerEvent } from 'react';

interface SheetHandleProps {
  /** With a header below it the handle takes the roomier bottom padding. */
  hasHeader: boolean;
  /** False when the sheet cannot be dragged away — the bar stays, the grab cursor goes. */
  draggable: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * The 36×4 grab bar, and the sheet's drag target.
 *
 * It is a redundant POINTER affordance: Esc, the backdrop and the 44×44 close button all reach the
 * same dismissal without it, so it carries no keyboard route of its own.
 */
export function SheetHandle({ hasHeader, draggable, onPointerDown }: SheetHandleProps) {
  return (
    <div
      className="hg-sheet-handle"
      data-grab={draggable ? 'true' : 'false'}
      data-header={hasHeader ? 'true' : 'false'}
      onPointerDown={onPointerDown}
    >
      <div className="hg-sheet-handle-bar" />
    </div>
  );
}
