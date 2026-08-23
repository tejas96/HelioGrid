import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ProgressBar } from '../ProgressBar';
import { buildChecklist, NO_PHASE } from './Checklist.groups';
import type { ChecklistProps } from './Checklist.types';
import { ChecklistRow } from './ChecklistRow';
import { ChecklistStateBody } from './ChecklistState';

interface WebChecklistProps extends ChecklistProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * **The list a coordinator ticks off on a roof** — `M05-76` / `SCR-MS-17`, `MS11-30`, `MS11-35`,
 * `MS10-10`.
 *
 * **A tick is a server write, not a checkbox flip.** Ticks persist per project, and `F8-36`
 * forbids showing an optimistic result — so the box holds its previous state, the row shows a
 * `PendingAction` line naming the act, the row stays operable, and only confirmed data flips it.
 *
 * **A phase heading cannot repeat** (`MS11-30`): items are grouped by phase in a stable order and
 * each heading is rendered once from its group — not by a change-detector walking a flat list.
 *
 * **Numbering is counted.** The number is the item's position in the whole list, so no second
 * count can disagree with it.
 */
export function Checklist({
  items,
  phases,
  onToggle,
  label,
  progressNote,
  countWords,
  noun = 'steps',
  surface = 'screen',
  state = 'ready',
  emptyTitle = 'No steps yet',
  emptyMessage = 'This checklist is built from the design. Generate one and the steps appear here.',
  errorTitle = "Couldn't load the checklist",
  errorMessage = 'Tap Try again — no tick is lost while this fails.',
  onRetry,
  unavailableTitle = 'No checklist for this job',
  unavailableMessage,
  note,
  className,
  style,
}: WebChecklistProps) {
  const model = buildChecklist(items, phases);

  if (state !== 'ready') {
    return (
      <section className={classNames('hg-checklist', className)} style={style}>
        {label === undefined ? null : <p className="hg-checklist-overline">{label}</p>}
        <ChecklistStateBody
          state={state}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </section>
    );
  }

  return (
    <section
      aria-label={typeof label === 'string' ? label : 'Checklist'}
      className={classNames('hg-checklist', className)}
      style={style}
    >
      <div className="hg-checklist-head">
        {label === undefined ? null : <p className="hg-checklist-overline">{label}</p>}
        {/* The count in words, then its meaning. A percentage alone says how far, never what. */}
        <p className="hg-checklist-count">
          {countWords ?? `${model.done} of ${model.list.length} ${noun} done`}
        </p>
        <ProgressBar value={model.percent} />
        {progressNote === undefined ? null : <p className="hg-checklist-micro">{progressNote}</p>}
      </div>

      {model.groups.map((group) => (
        <div className="hg-checklist-group" key={group.key}>
          {group.key === NO_PHASE ? null : (
            <div className="hg-checklist-phase">
              <h4 className="hg-checklist-overline">{group.heading}</h4>
              <span className="hg-checklist-micro hg-checklist-phase-count">
                {group.doneCount} of {group.items.length}
              </span>
            </div>
          )}
          {group.key === NO_PHASE || group.note === undefined ? null : (
            <p className="hg-checklist-micro">{group.note}</p>
          )}
          <ul className="hg-checklist-rows">
            {group.items.map((item) => (
              /* The counted number is the item's position in the WHOLE list, so it is unique
                 across every group — no second count, and no array index, can disagree. */
              <ChecklistRow
                key={item.id ?? `${group.key}-${String(model.numberFor(item))}`}
                item={item}
                number={model.numberFor(item)}
                onToggle={onToggle}
                surface={surface}
              />
            ))}
          </ul>
        </div>
      ))}

      {note === undefined ? null : <p className="hg-checklist-micro">{note}</p>}
    </section>
  );
}
