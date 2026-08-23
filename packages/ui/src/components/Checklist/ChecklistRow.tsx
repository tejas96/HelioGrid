import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import { renderActorClass } from '../ActorClass';
import { renderPending } from '../PendingAction';
import type { ChecklistItem, ChecklistProps } from './Checklist.types';

/** The box itself. `printable` is the paper form — an empty box, ticked with a pen. */
function TickBox({
  done,
  disabled,
  printable,
}: {
  done: boolean;
  disabled?: boolean;
  printable?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className="hg-checklist-box"
      data-done={done && printable !== true ? 'true' : undefined}
      data-disabled={disabled === true ? 'true' : undefined}
    >
      {done && printable !== true ? (
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 6.5 5 9l4.5-5" />
        </svg>
      ) : null}
    </span>
  );
}

function Body({ item, number }: { item: ChecklistItem; number: string | number }) {
  /* Attribution is ActorClass's job — the same four classes the stream and the task list use, so a
     tick the system inferred is visibly not a person's. Only a DONE item has anyone to name. */
  const attribution =
    item.done === true ? renderActorClass(item.doneBy, { form: 'stream', size: 12 }) : null;
  return (
    <div className="hg-checklist-body">
      <div className="hg-checklist-title-row">
        <span className="hg-checklist-number">{number}</span>
        <span className="hg-checklist-title">{item.title}</span>
      </div>
      {item.detail === undefined ? null : <p className="hg-checklist-detail">{item.detail}</p>}
      {item.materials !== undefined && item.materials.length > 0 ? (
        <p className="hg-checklist-micro">
          <span className="hg-checklist-materials-label">Materials </span>
          {item.materials.join(' · ')}
        </p>
      ) : null}
      {/* MS10-10: where the design can prove an item, the proof is a real link — never a claim. */}
      {item.evidence === undefined ? null : (
        <a
          className="hg-checklist-evidence"
          href={item.evidence.href}
          onClick={item.evidence.onOpen}
        >
          {item.evidence.label ?? 'See the evidence'}
          <Icon size="sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M17 7h-7m7 0v7" />
            </svg>
          </Icon>
        </a>
      )}
      {attribution !== null || item.doneAt !== undefined ? (
        <p className="hg-checklist-micro hg-checklist-attribution">
          {attribution}
          {attribution !== null && item.doneAt !== undefined ? (
            <span aria-hidden="true">·</span>
          ) : null}
          {item.doneAt}
        </p>
      ) : null}
      {/* The write in flight — PendingAction's line, never an optimistic flip of the box. */}
      {renderPending(item.pending, { size: 12 })}
    </div>
  );
}

/**
 * One step. **A tick is a server write, not a checkbox flip** — the box holds its previous state,
 * `item.pending` names the act, the row stays operable, and only confirmed data flips it (`F8-36`).
 */
export function ChecklistRow({
  item,
  number,
  onToggle,
  surface,
}: {
  item: ChecklistItem;
  number: string | number;
  onToggle: ChecklistProps['onToggle'];
  surface: NonNullable<ChecklistProps['surface']>;
}) {
  const done = item.done === true;
  const waiting = Boolean(item.pending);

  if (surface === 'document') {
    return (
      <li className="hg-checklist-row hg-checklist-row--document">
        <TickBox done={done} printable />
        <Body item={item} number={number} />
      </li>
    );
  }

  return (
    <li className="hg-checklist-row">
      {/* The primitive carries the role AND the checked state, so this control says what it is
          without dropping to a bare element — and the 44px floor and the focus ring come with it
          rather than being re-answered in Checklist.css. */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, busy: waiting ? true : undefined }}
        accessibilityLabel={`${typeof item.title === 'string' ? item.title : ''}${done ? ', done' : ', not done'}`}
        className="hg-checklist-toggle"
        onPress={() => onToggle?.(item, !done)}
      >
        <TickBox done={done} disabled={waiting} />
      </Pressable>
      <div className="hg-checklist-row-body">
        <Body item={item} number={number} />
      </div>
    </li>
  );
}
