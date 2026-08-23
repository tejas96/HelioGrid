import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { useKanbanDrag } from './Kanban.drag';
import { activeColumnKey, kanbanTotal, resolveBoardState } from './Kanban.logic';
import type { KanbanProps } from './Kanban.types';
import { KanbanColumnBlock } from './KanbanColumn';
import { KanbanStageStrip } from './KanbanStageStrip';
import { BoardStateView } from './KanbanStates';

/** Per-instance geometry rides in as custom properties; every colour stays in Kanban.css. */
type StyleVars = CSSProperties & Record<string, string | number | undefined>;

interface WebKanbanProps extends KanbanProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Pipeline board — sunken grey columns, floating functional cards, StatusChip headers.
 *
 * **Two forms, and the component owns the switch on its own width.** Above `stackBelow` the full
 * board scrolls sideways between columns; below it, `M08-10`'s phone answer — ONE COLUMN WITH A
 * STAGE FILTER, not nine columns stacked. The measurement is published through `onFormChange`,
 * because a screen cannot arrange around a breakpoint it is not told about.
 *
 * A move is always available without a mouse (always-visible 44px move buttons), and on the phone
 * form they are the only route: the destination column is not on screen.
 */
export function Kanban({
  columns = [],
  onCardClick,
  onMove,
  renderCard,
  cardPending,
  state = 'ready',
  emptyTitle = 'No jobs in this pipeline',
  emptyDescription,
  errorTitle = "Couldn't load the board",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'No pipeline here',
  unavailableMessage,
  columnWidth = 260,
  stackBelow = 720,
  stackedColumn,
  onStackedColumnChange,
  stageFilterLabel = 'Stage',
  onFormChange,
  className,
  style,
}: WebKanbanProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [own, setOwn] = useState<number | null>(null);
  const [pickInner, setPickInner] = useState<string | null>(null);
  const { dragging, over, handlers } = useKanbanDrag(onMove);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const first = entries[0];
      if (first) setOwn(first.contentRect.width);
    });
    ro.observe(el);
    setOwn(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const stacked = own !== null && own < stackBelow;

  /* The breakpoint is the component's, so the answer is the component's to publish. The callback
     rides in a ref so a caller's inline arrow cannot turn "when the answer changed" into "every
     render". */
  const formCb = useRef(onFormChange);
  useEffect(() => {
    formCb.current = onFormChange;
  }, [onFormChange]);
  useEffect(() => {
    if (own !== null) formCb.current?.({ stacked, width: own });
  }, [stacked, own]);

  const picked = stackedColumn !== undefined ? stackedColumn : pickInner;
  const activeKey = activeColumnKey(columns, picked);
  const setPick = (k: string) => {
    if (stackedColumn === undefined) setPickInner(k);
    onStackedColumnChange?.(k);
  };

  const vars: StyleVars = { '--hg-kanban-column-w': `${columnWidth}px`, ...style };

  const resolved = resolveBoardState(state, kanbanTotal(columns));
  if (resolved !== 'ready') {
    return (
      <div
        ref={ref}
        className={resolved === 'loading' ? classNames('hg-kanban-loading', className) : className}
        style={vars}
      >
        <BoardStateView
          state={resolved}
          stacked={stacked}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    );
  }

  const columnProps = {
    columns,
    stacked,
    dragging,
    drag: handlers,
    onCardClick,
    onMove,
    renderCard,
    cardPending,
  };

  /* THE PHONE FORM: one column, chosen by a stage strip that carries each stage's count. */
  if (stacked) {
    const active = columns.find((c) => c.key === activeKey) ?? columns[0];
    return (
      <div
        ref={ref}
        className={classNames('hg-kanban', className)}
        data-stacked="true"
        style={vars}
      >
        <KanbanStageStrip
          columns={columns}
          value={active?.key}
          label={stageFilterLabel}
          onChange={setPick}
        />
        {active ? (
          <KanbanColumnBlock
            {...columnProps}
            column={active}
            over={over === active.key}
            key={active.key}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div ref={ref} className={classNames('hg-kanban', className)} style={vars}>
      {columns.map((c) => (
        <KanbanColumnBlock {...columnProps} column={c} over={over === c.key} key={c.key} />
      ))}
    </div>
  );
}
