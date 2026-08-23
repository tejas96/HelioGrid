import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { chipEntries } from './ChipGroup.entries';
import type { ChipGroupProps, MarkRowProps } from './ChipGroup.types';

interface WebChipGroupProps extends ChipGroupProps {
  className?: string;
  style?: CSSProperties;
}

interface WebMarkRowProps extends MarkRowProps {
  className?: string;
  style?: CSSProperties;
}

/** The caller's numeric gap rides in as a custom property so no raw value lands in the file. */
function gapVar(gap: number, style?: CSSProperties): CSSProperties {
  return { ...style, '--hg-chip-group-gap': `${gap}px` } as CSSProperties;
}

/**
 * **Several labels in one cell, row or header, with one defined behaviour.**
 *
 * 1. Overflow is **by count, never by pixels** — the first `max` render whole, the rest collapse
 *    behind one "+N". A chip is never ellipsised, shrunk or cut off at a cell edge.
 * 2. "+N" is a **real control** — a 44px target around a chip-height pill, `aria-expanded`,
 *    revealing the rest **in place**. Never a tooltip: a touch user never sees one.
 * 3. Expanded, the chips **wrap**. No horizontal scroller; the row grows.
 * 4. An empty set renders `empty` and **is not an error** (`M01-34`).
 */
export function ChipGroup({
  children,
  max = 3,
  label,
  empty = null,
  expandable = true,
  defaultExpanded = false,
  density = 'expressive',
  gap = 6,
  className,
  style,
}: WebChipGroupProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const all = chipEntries(children);
  if (all.length === 0) return empty;

  const capped = max > 0 && all.length > max;
  const shown = capped && !open ? all.slice(0, max) : all;
  const hidden = all.length - shown.length;
  const noun = label ?? 'items';

  return (
    <ul
      aria-label={label}
      className={classNames('hg-chip-group', className)}
      data-density={density}
      style={gapVar(gap, style)}
    >
      {shown.map((entry) => (
        <li className="hg-chip-group-item" key={entry.key}>
          {entry.node}
        </li>
      ))}
      {capped ? (
        <li className="hg-chip-group-item">
          {expandable ? (
            /* The "+N" is a real control and its whole contract is announcing whether it is open,
               so the expanded state goes through the primitive — one declaration, `aria-expanded`
               here and `accessibilityState.expanded` on the native half — and the 44px floor and
               the focus ring come from `hg-pressable` rather than a second copy of the numbers. */
            <Pressable
              className="hg-chip-group-more"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={
                open ? `Show fewer ${noun}` : `Show ${hidden} more ${noun} (${all.length} in total)`
              }
              onPress={() => setOpen((previous) => !previous)}
            >
              <span className="hg-chip-group-count">{open ? 'Show fewer' : `+${hidden}`}</span>
            </Pressable>
          ) : (
            <span className="hg-chip-group-count">+{hidden}</span>
          )}
        </li>
      ) : null}
    </ul>
  );
}

/**
 * **Two facts are two chips, never one merged badge** (`SCR-M06-19`). No collapse — a mark a row
 * needs is never hidden behind a "+N".
 *
 * **Plain spans, not a list**, because half its hosts are controls (an `AccordionItem` header, a
 * tab, a menu item and an option card are all `<button>`, and a `<ul>` inside a button is invalid
 * content). Which is also why marks in those hosts must be non-interactive.
 */
export function MarkRow({ children, gap = 6, className, style }: WebMarkRowProps) {
  const all = chipEntries(children);
  if (all.length === 0) return null;
  return (
    <span className={classNames('hg-mark-row', className)} style={gapVar(gap, style)}>
      {all.map((entry) => (
        <span className="hg-mark-row-item" key={entry.key}>
          {entry.node}
        </span>
      ))}
    </span>
  );
}

/** What every `marks` host prop runs through: a ready node, or an array of nodes in a `MarkRow`. */
export function renderMarks(
  marks?: ReactNode | ReactNode[],
  extra?: Partial<WebMarkRowProps>,
): ReactNode {
  if (marks === undefined || marks === null || marks === false) return null;
  if (Array.isArray(marks)) return <MarkRow {...extra}>{marks}</MarkRow>;
  return marks;
}

ChipGroup.Marks = MarkRow;
ChipGroup.renderMarks = renderMarks;
