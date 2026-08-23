import { useState } from 'react';
import type { KanbanProps } from './Kanban.types';

/** The card in flight and the column it left. */
export interface KanbanDragState {
  id: string | number;
  from: string;
}

/** What a column surface and a card need to take part in a drag. */
export interface KanbanDragHandlers {
  onDragEnter: (key: string) => void;
  onDragLeave: (key: string) => void;
  onDrop: (key: string) => void;
  onDragStart: (next: KanbanDragState) => void;
  onDragEnd: () => void;
}

export interface KanbanDrag {
  dragging: KanbanDragState | null;
  over: string | null;
  handlers: KanbanDragHandlers;
}

/**
 * The board's HTML5 drag: which card is in flight, which column it is over, and the handlers that
 * move it. WEB ONLY, and deliberately not the move affordance — drag fires on neither a keyboard
 * nor a touch screen, so `MoveControls` on every card is the route both platforms share.
 */
export function useKanbanDrag(onMove: KanbanProps['onMove']): KanbanDrag {
  const [dragging, setDragging] = useState<KanbanDragState | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const handlers: KanbanDragHandlers = {
    onDragEnter: (key) => setOver(key),
    onDragLeave: (key) => setOver((k) => (k === key ? null : k)),
    onDrop: (key) => {
      setOver(null);
      if (dragging && onMove && dragging.from !== key) onMove(dragging.id, key, dragging.from);
      setDragging(null);
    },
    onDragStart: (next) => setDragging(next),
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
    },
  };

  return { dragging, over, handlers };
}
