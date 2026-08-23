import { StatusChip } from '../StatusChip';
import type { KanbanDragHandlers, KanbanDragState } from './Kanban.drag';
import { columnCountLabel } from './Kanban.logic';
import type { KanbanColumn, KanbanProps } from './Kanban.types';
import { KanbanCard } from './KanbanCard';

export interface KanbanColumnBlockProps {
  column: KanbanColumn;
  columns: KanbanColumn[];
  stacked: boolean;
  over: boolean;
  dragging: KanbanDragState | null;
  drag: KanbanDragHandlers;
  onCardClick?: KanbanProps['onCardClick'];
  onMove?: KanbanProps['onMove'];
  renderCard?: KanbanProps['renderCard'];
  cardPending?: KanbanProps['cardPending'];
}

/** One sunken column: a StatusChip header, its count (or n/limit), and its floating cards. */
export function KanbanColumnBlock({
  column,
  columns,
  stacked,
  over,
  dragging,
  drag,
  onCardClick,
  onMove,
  renderCard,
  cardPending,
}: KanbanColumnBlockProps) {
  const items = column.items ?? [];
  const overLimit = column.limit !== undefined && items.length > column.limit;
  return (
    /* The drop target is the column surface itself. The keyboard and touch route is MoveControls
       on every card — always visible, never hover-only, and 44x44. */
    // biome-ignore lint/a11y/noStaticElementInteractions: drag surface; MoveControls is the a11y route.
    <section
      className="hg-kanban-column"
      data-stacked={stacked ? 'true' : undefined}
      data-over={over ? 'true' : undefined}
      onDragOver={(e) => {
        if (onMove) {
          e.preventDefault();
          drag.onDragEnter(column.key);
        }
      }}
      onDragLeave={() => drag.onDragLeave(column.key)}
      onDrop={(e) => {
        e.preventDefault();
        drag.onDrop(column.key);
      }}
    >
      <header className="hg-kanban-column-head">
        {column.status ? (
          <StatusChip status={column.status} density="functional" label={column.label} />
        ) : (
          <span className="hg-kanban-column-name">{column.label}</span>
        )}
        {/* --text-tertiary measures 4.48 on --canvas-sunken, under the 4.5 floor, and the phone
            form makes this column the primary reading of that pair — so words on the sunken track
            take --text-secondary. */}
        <span className="hg-kanban-column-count" data-over-limit={overLimit ? 'true' : undefined}>
          {columnCountLabel(items.length, column.limit)}
        </span>
      </header>
      <div className="hg-kanban-column-body">
        {items.length === 0 ? (
          <p className="hg-kanban-column-empty">{column.emptyLabel || 'Nothing here'}</p>
        ) : (
          items.map((it) => (
            <KanbanCard
              key={it.id}
              item={it}
              column={column}
              columns={columns}
              dragging={dragging}
              drag={drag}
              onCardClick={onCardClick}
              onMove={onMove}
              renderCard={renderCard}
              cardPending={cardPending}
            />
          ))
        )}
      </div>
    </section>
  );
}
