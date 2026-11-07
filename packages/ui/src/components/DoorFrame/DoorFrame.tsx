import { type CSSProperties, type RefObject, useLayoutEffect, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text/Text';
import { SolarSky } from '../SolarSky';
import { ProductMark } from '../Wordmark';
import type { DoorFrameProps } from './DoorFrame.types';

interface WebDoorFrameProps extends DoorFrameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Every door and setup step: the living sky with the wordmark and the trailing control over it,
 * then the step's overline (`lead`), the identity, the task and the held action (`DoorFrame.css`).
 * On a phone width the column is a glass sheet over the sky's foot; from the desktop width the sky
 * is a panel beside it, telling the `story`. `taskMeasure` widens the column for choices.
 */
export function DoorFrame({
  sky = 'band',
  story,
  ownPanel = false,
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
      data-sky={sky}
      data-own-panel={ownPanel ? '' : undefined}
      data-measure={taskMeasure}
      data-column={column}
      data-bounded={bounded ? '' : undefined}
      style={style}
    >
      <div className="hg-door-sky">
        <SolarSky framing={sky} />
        {story === undefined ? null : (
          <div className="hg-door-story">
            <Text variant="display" as="p">
              {story.title}
            </Text>
            <Text variant="body-lg" color="secondary" as="p">
              {story.line}
            </Text>
          </div>
        )}
      </div>
      <header className="hg-door-header">
        <ProductMark />
        <div className="hg-door-trailing">{trailing}</div>
      </header>
      <div className="hg-door-page">
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
