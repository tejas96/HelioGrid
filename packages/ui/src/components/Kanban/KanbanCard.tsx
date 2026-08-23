import type { ReactNode } from 'react';
import { Avatar } from '../Avatar';
import { Card } from '../Card';
import { renderPending } from '../PendingAction';
import { renderProvenance } from '../Provenance';
import type { KanbanDragHandlers, KanbanDragState } from './Kanban.drag';
import { kanbanProvenance, moveTargets } from './Kanban.logic';
import type { KanbanCardItem, KanbanColumn, KanbanProps } from './Kanban.types';

interface MoveControlsProps {
  columns: KanbanColumn[];
  column: KanbanColumn;
  item: KanbanCardItem;
  onMove: NonNullable<KanbanProps['onMove']>;
}

/**
 * Moving a card must not require a mouse: HTML5 drag never fires on touch and cannot be driven
 * from a keyboard. These two buttons are ALWAYS VISIBLE — never hover-only — so a technician on
 * an Android tablet and a keyboard user get the same capability as a dragger. On the phone form
 * they are the ONLY route, because the destination column is not on screen at all. 44×44.
 */
function MoveControls({ columns, column, item, onMove }: MoveControlsProps) {
  const { prev, next } = moveTargets(columns, column);
  const button = (target: KanbanColumn | undefined, label: string, d: string) => (
    <button
      type="button"
      className="hg-kanban-move-button"
      disabled={!target}
      aria-label={target ? `${label} — move to ${target.label}` : label}
      onClick={(e) => {
        e.stopPropagation();
        if (target) onMove(item.id, target.key, column.key);
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
    </button>
  );
  return (
    <div className="hg-kanban-move">
      {button(prev, 'Move back a stage', 'm15 18-6-6 6-6')}
      {button(next, 'Move on a stage', 'm9 18 6-6-6-6')}
    </div>
  );
}

interface KanbanCardBodyProps {
  item: KanbanCardItem;
  column: KanbanColumn;
  onCardClick?: KanbanProps['onCardClick'];
}

/**
 * The card the board draws when the caller supplies no `renderCard`: title, the meta/value/owner
 * line, and the figure's tier under the figure it qualifies (`F8-01` / `F8-07`) — persistent
 * words on their own line, never a hover.
 */
function KanbanCardBody({ item, column, onCardClick }: KanbanCardBodyProps) {
  const prov = renderProvenance(kanbanProvenance(item), { size: 12 });
  return (
    <Card
      density="functional"
      interactive={Boolean(onCardClick)}
      onClick={onCardClick ? () => onCardClick(item, column) : undefined}
    >
      <div className="hg-kanban-card-title">{item.title}</div>
      <div className="hg-kanban-card-line">
        <span className="hg-kanban-card-meta">{item.meta}</span>
        {item.value ? <span className="hg-kanban-card-value">{item.value}</span> : null}
        {item.owner ? <Avatar name={item.owner} size={24} /> : null}
      </div>
      {prov ? <div className="hg-kanban-card-provenance">{prov}</div> : null}
    </Card>
  );
}

export interface KanbanCardProps {
  item: KanbanCardItem;
  column: KanbanColumn;
  columns: KanbanColumn[];
  dragging: KanbanDragState | null;
  drag: KanbanDragHandlers;
  onCardClick?: KanbanProps['onCardClick'];
  onMove?: KanbanProps['onMove'];
  renderCard?: KanbanProps['renderCard'];
  cardPending?: KanbanProps['cardPending'];
}

/**
 * One card's shell: the drag surface, whether its move is in flight, and the move buttons under
 * it. The card is **not** dimmed, disabled or covered while a move waits — a second move can
 * start while the first is still going (`SCR-M08-01`).
 */
export function KanbanCard({
  item,
  column,
  columns,
  dragging,
  drag,
  onCardClick,
  onMove,
  renderCard,
  cardPending,
}: KanbanCardProps) {
  const pending = cardPending ? cardPending(item, column) : null;
  const busy = pending !== null && pending.state !== 'returned';
  const card: ReactNode = renderCard ? (
    renderCard(item, column)
  ) : (
    <KanbanCardBody item={item} column={column} onCardClick={onCardClick} />
  );
  return (
    /* The drag handle is the card surface; every card also carries always-visible 44px
       MoveControls, which are the keyboard and touch route the DS requires. */
    // biome-ignore lint/a11y/noStaticElementInteractions: drag surface; MoveControls is the a11y route.
    <div
      className="hg-kanban-card"
      draggable={Boolean(onMove)}
      data-draggable={onMove ? 'true' : undefined}
      data-clickable={!onMove && onCardClick ? 'true' : undefined}
      data-dragging={dragging && dragging.id === item.id ? 'true' : undefined}
      aria-busy={busy ? 'true' : undefined}
      onDragStart={() => drag.onDragStart({ id: item.id, from: column.key })}
      onDragEnd={drag.onDragEnd}
    >
      {card}
      {pending ? <div className="hg-kanban-card-pending">{renderPending(pending)}</div> : null}
      {onMove ? (
        <MoveControls columns={columns} column={column} item={item} onMove={onMove} />
      ) : null}
    </div>
  );
}
