import { useId } from 'react';
import { FilterChips } from '../FilterBar';
import { stageCounts } from './Kanban.logic';
import type { KanbanColumn } from './Kanban.types';

export interface KanbanStageStripProps {
  columns: KanbanColumn[];
  /** The stage on screen, or nothing when the board has no columns at all. */
  value: string | undefined;
  /** The overline above the strip. `''` drops the visible line, never the accessible name. */
  label: string;
  onChange: (key: string) => void;
}

/**
 * The phone form's navigation: one chip per stage, carrying that stage's count. `FilterChips`
 * because a stage strip is one-of-N by construction — the same strip the records-list pattern
 * uses, never a private one.
 *
 * The visible line and the accessible name are THE SAME STRING: `aria-labelledby` points the
 * tablist at the overline. A visible label that leaves the strip unnamed for a screen reader is
 * the defect this pairing fixes, on the one form where the filter IS the navigation.
 */
export function KanbanStageStrip({ columns, value, label, onChange }: KanbanStageStripProps) {
  const autoId = useId();
  return (
    <>
      {label ? (
        <span id={`${autoId}-stage`} className="hg-kanban-stage-label">
          {label}
        </span>
      ) : null}
      <FilterChips
        options={columns.map((c) => ({ value: c.key, label: c.label }))}
        labelledBy={label ? `${autoId}-stage` : undefined}
        label={label ? undefined : 'Stage'}
        value={value}
        onChange={onChange}
        counts={stageCounts(columns)}
        scroll
      />
    </>
  );
}
