import { type CSSProperties, type RefObject, useLayoutEffect, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { BrandBloom } from '../BrandBloom';
import { Wordmark } from '../Wordmark';
import type { DoorFrameProps } from './DoorFrame.types';

/* The export's `wmMobile` and `wmDesktop`: 120×28 in the phone header, 220×52 atop the desktop
   identity column — and 30 atop the onboarding brand pane (`SCR-M01-07` d-default). */
const WORDMARK_SIZE_PHONE = 24;
const WORDMARK_SIZE_DESKTOP = { door: 44, onboarding: 30 } as const;

interface WebDoorFrameProps extends DoorFrameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The canvas, the bloom and the slots every door frame shares. Under the door's breakpoint the
 * phone's single column — the step header, the identity, the task, and the action held at the
 * window's foot — with the wordmark in the header row; from it the two fields: the identity on
 * the left under the wordmark, and the step header, the task and the action stacked on the right
 * (`DoorFrame.css` shows one wordmark, never both). `taskMeasure` names the task column's
 * measure; the stylesheet carries the two widths, and neither grows with the window. `panes`
 * `onboarding` lays the same slots out as the setup steps' brand and task panes (`DoorPanes.css`).
 */
export function DoorFrame({
  trailing,
  panes = 'door',
  lead,
  identity,
  footer,
  onFooterHeight,
  taskMeasure = 'field',
  column,
  children,
  className,
  style,
}: WebDoorFrameProps) {
  const footerRef = useRef<HTMLDivElement>(null);
  useScrollPaddingFor(footerRef, footer !== undefined, onFooterHeight);
  return (
    <main
      className={classNames('hg-door', className)}
      data-panes={panes}
      data-measure={taskMeasure}
      data-column={column}
      style={style}
    >
      <BrandBloom placement="top" className="hg-door-bloom-phone" />
      <BrandBloom placement="desktop" className="hg-door-bloom-desktop" />
      <div className="hg-door-page">
        <header className="hg-door-header">
          <span className="hg-door-wordmark">
            <Wordmark size={WORDMARK_SIZE_PHONE} />
          </span>
          <div className="hg-door-trailing">{trailing}</div>
        </header>
        <div className="hg-door-body">
          {lead === undefined || panes === 'onboarding' ? null : (
            <div className="hg-door-lead">{lead}</div>
          )}
          <section className="hg-door-identity">
            {panes === 'onboarding' ? (
              <BrandBloom placement="desktop-wide" className="hg-door-bloom-pane" />
            ) : null}
            <span className="hg-door-wordmark-desktop">
              <Wordmark size={WORDMARK_SIZE_DESKTOP[panes]} />
            </span>
            {panes === 'onboarding' ? (
              <div className="hg-door-pane-body">{identity}</div>
            ) : (
              identity
            )}
          </section>
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
