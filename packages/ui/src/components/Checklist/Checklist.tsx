import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { ProgressBar } from '../ProgressBar';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { buildChecklist, NO_PHASE } from './Checklist.groups';
import { checklistNameOf, countLineOf, rowKeyOf } from './Checklist.logic';
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
  noun,
  words,
  surface = 'screen',
  read,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  note,
  className,
  style,
}: WebChecklistProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  const model = buildChecklist(items, phases);
  /* The list's frame outlives its states, so focus lands on it once the retry has left. */
  const frame = useRef<HTMLElement>(null);

  if (state !== 'ready') {
    return (
      <section
        ref={frame}
        tabIndex={-1}
        className={classNames('hg-checklist', 'hg-focus-target', className)}
        style={style}
      >
        {label === undefined ? null : <p className="hg-checklist-overline">{label}</p>}
        <ChecklistStateBody
          state={state}
          loadingLabel={words.loading}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </section>
    );
  }

  return (
    <section
      ref={frame}
      tabIndex={-1}
      aria-label={checklistNameOf(label, words)}
      className={classNames('hg-checklist', 'hg-focus-target', className)}
      style={style}
    >
      <div className="hg-checklist-head">
        {label === undefined ? null : <p className="hg-checklist-overline">{label}</p>}
        {/* The count in words, then its meaning. A percentage alone says how far, never what. */}
        <p className="hg-checklist-count">{countLineOf(model, countWords, noun, words)}</p>
        <ProgressBar value={model.percent} />
        {progressNote === undefined ? null : <p className="hg-checklist-micro">{progressNote}</p>}
      </div>

      {model.groups.map((group) => (
        <div className="hg-checklist-group" key={group.key}>
          {group.key === NO_PHASE ? null : (
            <div className="hg-checklist-phase">
              <h4 className="hg-checklist-overline">{group.heading}</h4>
              <span className="hg-checklist-micro hg-checklist-phase-count">
                {words.phaseCount(group.doneCount, group.items.length)}
              </span>
            </div>
          )}
          {group.key === NO_PHASE || group.note === undefined ? null : (
            <p className="hg-checklist-micro">{group.note}</p>
          )}
          <ul className="hg-checklist-rows">
            {group.items.map((item) => (
              <ChecklistRow
                key={rowKeyOf(item, group, model)}
                item={item}
                number={model.numberFor(item)}
                onToggle={onToggle}
                surface={surface}
                words={words}
              />
            ))}
          </ul>
        </div>
      ))}

      {note === undefined ? null : <p className="hg-checklist-micro">{note}</p>}
    </section>
  );
}
