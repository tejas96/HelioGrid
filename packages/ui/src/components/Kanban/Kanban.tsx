import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useOwnWidth } from '../../primitives/use-own-width';
import { useStackedForm } from '../DataTable/use-stacked-form';
import { retryOf } from '../UnavailableNote/UnavailableNote.read';
import { useKanbanDrag } from './Kanban.drag';
import { boardStateOf, KANBAN_DEFAULTS } from './Kanban.logic';
import type { KanbanProps } from './Kanban.types';
import { KanbanColumnBlock } from './KanbanColumn';
import { KanbanStageStrip } from './KanbanStageStrip';
import { BoardStateView } from './KanbanStates';
import { useStagePick } from './use-stage-pick';

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
  read,
  words,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  columnWidth = KANBAN_DEFAULTS.columnWidth,
  stackBelow = KANBAN_DEFAULTS.stackBelow,
  stackedColumn,
  onStackedColumnChange,
  stageFilterLabel = words.stage,
  onFormChange,
  className,
  style,
}: WebKanbanProps) {
  const onRetry = retryOf(read);
  /* The board's own frame: its width is measured here, and focus lands on it once a retry has
     left, since it outlives every state. */
  const [ref, own] = useOwnWidth();
  const { dragging, over, handlers } = useKanbanDrag(onMove);
  const stacked = useStackedForm(own, stackBelow, onFormChange);
  const { active, setPick } = useStagePick(columns, stackedColumn, onStackedColumnChange);

  const vars: StyleVars = { '--hg-kanban-column-w': `${columnWidth}px`, ...style };

  const resolved = boardStateOf(read, columns);
  if (resolved !== 'ready') {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        className={classNames(
          resolved === 'loading' ? 'hg-kanban-loading' : undefined,
          'hg-focus-target',
          className,
        )}
        style={vars}
      >
        <BoardStateView
          state={resolved}
          stacked={stacked}
          loadingLabel={words.loading}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={ref}
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
    words,
  };

  /* THE PHONE FORM: one column, chosen by a stage strip that carries each stage's count. */
  if (stacked) {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        className={classNames('hg-kanban', 'hg-focus-target', className)}
        data-stacked="true"
        style={vars}
      >
        <KanbanStageStrip
          columns={columns}
          value={active?.key}
          label={stageFilterLabel}
          onChange={setPick}
          words={words}
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
    <div
      ref={ref}
      tabIndex={-1}
      className={classNames('hg-kanban', 'hg-focus-target', className)}
      style={vars}
    >
      {columns.map((c) => (
        <KanbanColumnBlock {...columnProps} column={c} over={over === c.key} key={c.key} />
      ))}
    </div>
  );
}
