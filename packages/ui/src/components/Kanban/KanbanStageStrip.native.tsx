/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Text } from '../../primitives/Text/Text.native';
import { FilterChips } from '../FilterBar/FilterBar.native';
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
 * The visible line and the accessible name are THE SAME STRING on both platforms; RN has no
 * `aria-labelledby`, so the strip takes the string itself as its `label`.
 */
export function KanbanStageStrip({ columns, value, label, onChange }: KanbanStageStripProps) {
  return (
    <>
      {label ? (
        <Text variant="overline" color="secondary">
          {label}
        </Text>
      ) : null}
      <FilterChips
        options={columns.map((c) => ({ value: c.key, label: c.label }))}
        label={label || 'Stage'}
        value={value}
        onChange={onChange}
        counts={stageCounts(columns)}
        scroll
      />
    </>
  );
}
