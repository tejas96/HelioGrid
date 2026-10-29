import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { TooltipProps } from './Tooltip.types';
import { useDelayedOpen } from './use-delayed-open';

interface WebTooltipProps extends TooltipProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A near-black label for a control whose meaning isn't obvious. Opens on hover AND on keyboard
 * focus (nothing in this system is hover-only), closes on Escape. Never put information here that
 * exists nowhere else; a field user on a touch screen will never see it.
 */
export function Tooltip({
  label,
  children,
  placement = 'top',
  delay = 300,
  className,
  style,
}: WebTooltipProps) {
  const { open, show, hide } = useDelayedOpen(delay);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the wrapper only mirrors the child control's own hover/focus/Escape; the control inside keeps every semantic it had.
    <span
      className={classNames('hg-tooltip', className)}
      style={style}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          hide();
        }
      }}
    >
      {children}
      {open ? (
        <span role="tooltip" data-placement={placement} className="hg-tooltip-bubble">
          {label}
        </span>
      ) : null}
    </span>
  );
}
