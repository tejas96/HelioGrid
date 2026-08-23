/* This half is the WEB half and it reaches for real DOM globals. Sibling components import
   overlay barrels rather than `.native` paths, which drags this file into the native tsconfig's
   program, so it declares the lib it needs instead of failing there. */
/// <reference lib="dom" />
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useState } from 'react';

/** Past this many px of downward drag the sheet closes instead of springing back. */
export const DRAG_DISMISS = 96;

export interface SheetDrag {
  /** Live offset, in px. `0` means the sheet is at rest and its entry animation may run. */
  dragY: number;
  /** True while a finger owns the transform — the transition steps aside for it. */
  dragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * Drag-to-dismiss on the handle (or on the header, when there is no handle). The drag only starts
 * when the body is scrolled to the top, so pulling a long list down never closes the sheet under
 * the reader.
 */
export function useSheetDrag(
  bodyRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onClose?: () => void,
): SheetDrag {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const body = bodyRef.current;
    if (!enabled || (body !== null && body.scrollTop > 0)) {
      return;
    }
    const startY = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const move = (moved: PointerEvent) => setDragY(Math.max(0, moved.clientY - startY));
    const up = (ended: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragging(false);
      if (Math.max(0, ended.clientY - startY) > DRAG_DISMISS && onClose !== undefined) {
        onClose();
        return;
      }
      setDragY(0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return { dragY, dragging, onPointerDown };
}
