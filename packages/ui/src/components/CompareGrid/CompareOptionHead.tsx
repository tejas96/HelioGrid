import { renderMarks } from '../ChipGroup/ChipGroup';
import type { CompareOption } from './CompareGrid.types';

interface OptionHeadProps<Opt extends CompareOption> {
  option: Opt;
  selected: boolean;
  selectedLabel: string;
  currentLabel: string;
}

/**
 * **The column heading for one option** — its name, its subtitle, the words that describe its
 * standing, and its marks.
 *
 * `current` is not `selected`: you choose the one you are moving TO, so the option in force wears
 * its own word in its own pill and the two facts can be true at once. This is also the one snap
 * target per column, so a swipe lands a whole option against the pinned label column.
 */
export function CompareOptionHead<Opt extends CompareOption>({
  option,
  selected,
  selectedLabel,
  currentLabel,
}: OptionHeadProps<Opt>) {
  return (
    <th
      scope="col"
      className="hg-compare-option-head"
      data-selected={selected ? 'true' : undefined}
    >
      <div className="hg-compare-option-stack">
        <span className="hg-compare-option-name">{option.name}</span>
        {option.subtitle === undefined ? null : (
          <span className="hg-compare-option-subtitle">{option.subtitle}</span>
        )}
        <span className="hg-compare-option-pills">
          {option.current === true ? (
            <span className="hg-compare-pill" data-kind="current">
              {currentLabel}
            </span>
          ) : null}
          {selected ? (
            <span className="hg-compare-pill" data-kind="selected">
              {selectedLabel}
            </span>
          ) : null}
        </span>
        {option.marks === undefined ? null : renderMarks(option.marks)}
      </div>
    </th>
  );
}
