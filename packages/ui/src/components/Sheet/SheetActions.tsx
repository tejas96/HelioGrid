/* This half is the WEB half and it reaches for real DOM globals. Sibling components import
   overlay barrels rather than `.native` paths, which drags this file into the native tsconfig's
   program, so it declares the lib it needs instead of failing there. */
/// <reference lib="dom" />
import type { CSSProperties, ReactElement } from 'react';
import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { SheetActionsProps } from './Sheet.types';

interface WebSheetActionsProps extends SheetActionsProps {
  className?: string;
  style?: CSSProperties;
}

/** Every action this row stacks is a Button-shaped child; `fullWidth` is what it hands them. */
type FullWidthChild = ReactElement<{ fullWidth?: boolean }>;

/**
 * Footer action row for Sheet/Modal/DetailPanel.
 *
 * It measures ITS OWN width (never the viewport): below `stackBelow` the actions stack full-width,
 * primary on top, so two verb labels never clip inside a narrow sheet. A sheet in a 480px desktop
 * detail panel gets the same answer as one on a 375px phone.
 *
 * And it PUBLISHES the answer (law 4): `onFormChange({stacked, width})`, the same callback shape
 * Kanban and DataTable use, so a caller arranging anything around this row reads the row's own
 * measurement instead of mounting a second observer that can disagree with it.
 */
export function SheetActions({
  children,
  stackBelow = 320,
  onFormChange,
  className,
  style,
}: WebSheetActionsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);
  const [own, setOwn] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }
      setOwn(entry.contentRect.width);
      setStacked(entry.contentRect.width < stackBelow);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [stackBelow]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the reference publishes on the ANSWER changing, not on a new callback identity — adding onFormChange here would re-fire on every render of a caller passing an inline arrow.
  useEffect(() => {
    if (own !== null && onFormChange !== undefined) {
      onFormChange({ stacked, width: own });
    }
  }, [stacked, own]);

  return (
    <div
      className={classNames('hg-sheet-actions', className)}
      data-stacked={stacked ? 'true' : 'false'}
      ref={ref}
      style={style}
    >
      {Children.map(children, (child) =>
        isValidElement(child) ? (
          <div className="hg-sheet-actions-slot">
            {cloneElement(child as FullWidthChild, { fullWidth: true })}
          </div>
        ) : (
          child
        ),
      )}
    </div>
  );
}
