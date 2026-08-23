import type { KeyboardEvent, MouseEvent, ReactElement, Ref } from 'react';
import { cloneElement } from 'react';
import { OverflowGlyph } from './MenuGlyphs';

/** What the wrapper hands a caller-supplied trigger. Its own handlers still run first. */
type TriggerElement = ReactElement<{
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu';
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}>;

interface MenuTriggerProps {
  disabled: boolean;
  /** The menu's accessible name — also the default trigger's `aria-label`. */
  label: string;
  onOpen: () => void;
  onToggle: () => void;
  open: boolean;
  trigger?: ReactElement;
  wrapRef: Ref<HTMLSpanElement>;
}

/**
 * The trigger, wrapped rather than ref-forwarded: a caller's trigger may be any component (Button
 * is a plain function component with no `forwardRef`), so focus restore goes through the wrapper's
 * focusable child instead of a ref on the child itself.
 */
export function MenuTrigger({
  disabled,
  label,
  onOpen,
  onToggle,
  open,
  trigger,
  wrapRef,
}: MenuTriggerProps) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onOpen();
    }
  };

  if (trigger !== undefined) {
    const element = trigger as TriggerElement;
    return (
      <span className="hg-menu-trigger" ref={wrapRef}>
        {cloneElement(element, {
          'aria-expanded': open,
          'aria-haspopup': 'menu',
          disabled,
          onClick: (event: MouseEvent) => {
            element.props.onClick?.(event);
            onToggle();
          },
          onKeyDown,
        })}
      </span>
    );
  }

  return (
    <span className="hg-menu-trigger" ref={wrapRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="hg-menu-overflow"
        data-open={open ? 'true' : 'false'}
        disabled={disabled}
        onClick={onToggle}
        onKeyDown={onKeyDown}
        type="button"
      >
        <OverflowGlyph />
      </button>
    </span>
  );
}
