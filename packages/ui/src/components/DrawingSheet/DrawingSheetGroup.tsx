import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
} from 'react';
import { classNames } from '../../primitives/class-names';
import { PageSizeOwnerContext, usePageSize } from '../../utils/page-size';
import type { DrawingSheetGroupProps, DrawingSheetProps } from './DrawingSheet.types';

interface WebDrawingSheetGroupProps extends DrawingSheetGroupProps {
  className?: string;
  style?: CSSProperties;
}

function isSheet(child: unknown): child is ReactElement<DrawingSheetProps> {
  return isValidElement(child);
}

/**
 * DrawingSheetGroup — the set, and the reason MS8-02's consistency is not a caller's discipline.
 *
 * It counts its children, hands each one the group's paper, orientation, scale, shared title-block
 * fields and travelling disclaimer, and gives each its own counted `sheet` number against the
 * group's total. No sheet states its own total, so no two sheets can disagree.
 *
 * **It also owns the page box.** `@page` is document-level, so the set's paper and orientation are
 * declared once here rather than by each sheet — otherwise the last sheet to mount would decide
 * the paper for the whole document, which is the drift MS8-02 forbids.
 */
export function DrawingSheetGroup({
  children,
  paper,
  orientation,
  scale,
  titleBlock,
  disclaimer,
  gap,
  className,
  style,
}: WebDrawingSheetGroupProps) {
  const items = Children.toArray(children).filter(isSheet);
  /* The set's paper: the group's own, else the first sheet's, else DrawingSheet's defaults. */
  const setPaper = paper ?? items[0]?.props.paper ?? 'a4';
  const setOrientation = orientation ?? items[0]?.props.orientation ?? 'landscape';
  usePageSize({ paper: setPaper, orientation: setOrientation });
  return (
    <PageSizeOwnerContext.Provider value={true}>
      <div
        className={classNames('hg-sheet-stack', 'hg-drawing-sheet-stack', className)}
        style={gap === undefined ? style : { gap, ...style }}
      >
        {items.map((el, i) => {
          const own = el.props;
          return cloneElement(el, {
            paper: own.paper ?? paper,
            orientation: own.orientation ?? orientation,
            scale: own.scale ?? scale,
            disclaimer: own.disclaimer ?? disclaimer,
            titleBlock: { ...titleBlock, ...own.titleBlock },
            sheet: i + 1,
            sheets: items.length,
          });
        })}
      </div>
    </PageSizeOwnerContext.Provider>
  );
}
