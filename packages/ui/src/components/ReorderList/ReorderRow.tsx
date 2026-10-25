/* One row of an authored order (web) — its position, the caller's body over the compliance floor
   that qualifies the WHOLE row, and the three targets that change the order.

   Every target is 44×44 and nothing is hover-only: this list's stated home is 375px. With the
   targets at the row's foot, the caller's own act opens that line, ahead of ⌃ in the tab order —
   which is why it is the first child of the same group rather than a sibling drawn beside it. */

import type { ReactNode } from 'react';
import { Text } from '../../primitives/Text';
import type { ComplianceFloorSpec } from '../ComplianceFloor';
import { renderComplianceFloor } from '../ComplianceFloor';
import { ReorderControl } from './ReorderControls';
import type { MoveDirection } from './ReorderList.defaults';
import { deleteLabel, moveLabel } from './ReorderList.defaults';
import type { ControlSuffix } from './ReorderList.focus';
import type { ReorderListControls, ReorderListDensity } from './ReorderList.types';

interface ReorderRowProps {
  index: number;
  total: number;
  /** The row's name — said in every button label. */
  name: string;
  /** The caller's fields, or the row's name when it renders none. */
  body: ReactNode;
  /** A row protected by law renders its floor here and has no delete button. */
  lock: ComplianceFloorSpec | ReactNode | null;
  deletable: boolean;
  placement: ReorderListControls;
  /** The caller's act for this row — drawn only at the foot, at the start of its line. */
  action: ReactNode;
  density: ReorderListDensity;
  flashing: boolean;
  onFlashEnd: () => void;
  onMove: (dir: MoveDirection) => void;
  onDelete: () => void;
  registerControl: (suffix: ControlSuffix, el: HTMLButtonElement | null) => void;
}

export function ReorderRow({
  index,
  total,
  name,
  body,
  lock,
  deletable,
  placement,
  action,
  density,
  flashing,
  onFlashEnd,
  onMove,
  onDelete,
  registerControl,
}: ReorderRowProps) {
  const stacked = placement === 'stack' ? 'true' : undefined;
  return (
    <li
      className="hg-reorder-row"
      data-density={density}
      data-stack={stacked}
      data-controls={placement}
      data-flash={flashing ? 'true' : undefined}
      onTransitionEnd={() => {
        if (flashing) {
          onFlashEnd();
        }
      }}
    >
      {/* The position is a fact the sighted reader gets from the order and a screen-reader
          user does not, so it is stated once per row rather than only on move. */}
      <span className="hg-reorder-position" data-stack={stacked}>
        {index + 1}
        {/* NAME_FROM_CONTENT (check h): "1" alone is not the fact, "1 of 5" is — and the
            denominator is CONTENT here where the native half carries the whole sentence in
            `accessibilityLabel`. Through the DS `Text` primitive so the name source is declared
            rather than buried in a clipped `<span>` the parity gate cannot read. */}
        <Text as="span" spokenOnly>
          {` of ${total}`}
        </Text>
      </span>
      <div className="hg-reorder-body">
        {body}
        {/* The floor's declared slot: its own line under the row's body, never inside the
            caller's fields — it qualifies the ROW, not any one of them. */}
        {renderComplianceFloor(lock)}
      </div>
      <div className="hg-reorder-controls" data-stack={stacked} data-controls={placement}>
        {action ? <div className="hg-reorder-action">{action}</div> : null}
        <ReorderControl
          kind="up"
          disabled={index === 0}
          onClick={() => onMove('up')}
          buttonRef={(el) => {
            registerControl('up', el);
          }}
          label={moveLabel(name, 'up', index, total)}
        />
        <ReorderControl
          kind="down"
          disabled={index === total - 1}
          onClick={() => onMove('down')}
          buttonRef={(el) => {
            registerControl('down', el);
          }}
          label={moveLabel(name, 'down', index, total)}
        />
        {deletable ? (
          <ReorderControl
            kind="delete"
            tone="danger"
            onClick={onDelete}
            buttonRef={(el) => {
              registerControl('delete', el);
            }}
            label={deleteLabel(name, index, total)}
          />
        ) : null}
      </div>
    </li>
  );
}
