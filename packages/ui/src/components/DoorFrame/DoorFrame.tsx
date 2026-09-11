import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { BrandBloom } from '../BrandBloom';
import { Wordmark } from '../Wordmark';
import type { DoorFrameProps } from './DoorFrame.types';

/* The export's `wmMobile` and `wmDesktop`: 120×28 in the phone header, 220×52 atop the desktop identity column. */
const WORDMARK_SIZE_PHONE = 24;
const WORDMARK_SIZE_DESKTOP = 44;

interface WebDoorFrameProps extends DoorFrameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The canvas, the bloom and the two columns every door frame shares: the identity on the left,
 * the one task on the right, the wordmark atop the identity — and under the door's own
 * breakpoint the phone's single column, where the wordmark sits in the header row instead
 * (`DoorFrame.css` shows one of the two, never both). `taskMeasure` names the task column's
 * measure; the stylesheet carries the two widths, and neither grows with the window.
 */
export function DoorFrame({
  trailing,
  identity,
  footer,
  taskMeasure = 'field',
  children,
  className,
  style,
}: WebDoorFrameProps) {
  return (
    <main className={classNames('hg-door', className)} data-measure={taskMeasure} style={style}>
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
          <section className="hg-door-identity">
            <span className="hg-door-wordmark-desktop">
              <Wordmark size={WORDMARK_SIZE_DESKTOP} />
            </span>
            {identity}
          </section>
          <section className="hg-door-task">{children}</section>
        </div>
        {footer === undefined ? null : <div className="hg-door-footer">{footer}</div>}
      </div>
    </main>
  );
}
