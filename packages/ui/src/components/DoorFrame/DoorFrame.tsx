import { type CSSProperties, type RefObject, useLayoutEffect, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { ProductMark } from '../Wordmark';
import type { DoorFrameProps } from './DoorFrame.types';

interface WebDoorFrameProps extends DoorFrameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Every door and setup step: one centred column on the page's glow, at every width — the product
 * mark and the trailing control, then the step's overline (`lead`), the identity, the task and the
 * held action (`DoorFrame.css`). `taskMeasure` widens the column for choices read side by side.
 */
export function DoorFrame({
  trailing,
  lead,
  identity,
  footer,
  onFooterHeight,
  taskMeasure = 'field',
  column,
  bounded = false,
  children,
  className,
  style,
}: WebDoorFrameProps) {
  const footerRef = useRef<HTMLDivElement>(null);
  useScrollPaddingFor(footerRef, footer !== undefined, onFooterHeight);
  return (
    <main
      className={classNames('hg-door', className)}
      data-measure={taskMeasure}
      data-column={column}
      data-bounded={bounded ? '' : undefined}
      style={style}
    >
      <div className="hg-door-page">
        <header className="hg-door-header">
          <ProductMark />
          <div className="hg-door-trailing">{trailing}</div>
        </header>
        <div className="hg-door-body">
          {lead === undefined ? null : <div className="hg-door-lead">{lead}</div>}
          {identity === undefined ? null : (
            <section className="hg-door-identity">{identity}</section>
          )}
          <section className="hg-door-task">{children}</section>
          {footer === undefined ? null : (
            <div ref={footerRef} className="hg-door-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * The window scrolls with the held action over its foot, so a field the browser brings into view
 * stops above the action instead of under it: the page's scroll padding follows the action's
 * height while it is held, and is given back when the door leaves. The height is told to
 * `onFooterHeight` as it changes.
 */
function useScrollPaddingFor(
  footerRef: RefObject<HTMLDivElement | null>,
  held: boolean,
  onFooterHeight: ((height: number) => void) | undefined,
) {
  useLayoutEffect(() => {
    const footer = footerRef.current;
    if (!held || footer === null || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const sticking = getComputedStyle(footer).position === 'sticky';
      root.style.scrollPaddingBottom = sticking ? `${footer.offsetHeight}px` : '';
      onFooterHeight?.(footer.offsetHeight);
    });
    observer.observe(footer);
    return () => {
      observer.disconnect();
      root.style.scrollPaddingBottom = '';
    };
  }, [footerRef, held, onFooterHeight]);
}
