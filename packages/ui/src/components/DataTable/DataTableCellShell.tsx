import type { ReactNode } from 'react';
import type { DataTableColumn } from './DataTableColumn.types';

/**
 * **The column's own flags, as the cell's typography.** Mono for figures, weight for the record's
 * name, the muted ground for a supporting column — four facts the stylesheet reads off the cell
 * rather than four class names each caller has to remember.
 */
function columnToneAttrs<Row>(column: DataTableColumn<Row>) {
  return {
    'data-mono': column.mono === true || column.numeric === true ? 'true' : undefined,
    'data-numeric': column.numeric === true ? 'true' : undefined,
    'data-strong': column.primary === true || column.strong === true ? 'true' : undefined,
    'data-muted': column.muted === true ? 'true' : undefined,
  };
}

/**
 * **One `<td>` of a record row.** It holds no value of its own — the value is its child. Its job is
 * the cell's shape: the column's width, its alignment and typography, the room a live cell needs,
 * and which edge of the row it sits on.
 *
 * A live cell swallows the row's click so its editor keeps its own taps; the editor is the
 * interaction.
 */
export function CellShell<Row>({
  column,
  align,
  columnIndex,
  columnCount,
  selectable,
  hasActions,
  roomy,
  live,
  children,
}: {
  column: DataTableColumn<Row>;
  align: 'left' | 'right' | 'center';
  columnIndex: number;
  columnCount: number;
  selectable: boolean;
  hasActions: boolean;
  roomy: boolean;
  live: boolean;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: a live cell only swallows the row's click so its editor keeps its own taps; the editor is the interaction.
    <td
      className="hg-dt-cell-shell"
      style={column.width === undefined ? undefined : { width: column.width }}
      data-align={align}
      data-first={columnIndex === 0 && !selectable ? 'true' : undefined}
      data-last={columnIndex === columnCount - 1 && !hasActions ? 'true' : undefined}
      data-roomy={roomy ? 'true' : undefined}
      data-wrap={column.wrap === true ? 'true' : undefined}
      {...columnToneAttrs(column)}
      onClick={live ? (event) => event.stopPropagation() : undefined}
    >
      {children}
    </td>
  );
}
