import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderActionReason } from '../ActionReason';
import type { IconButtonProps } from './IconButton.types';

interface WebIconButtonProps extends IconButtonProps {
  className?: string;
  /** Lands on the circle, never on the reason column — the DS contract for `style`. */
  style?: CSSProperties;
}

/**
 * Perfect-circle icon button. White fill + e1 at rest.
 *
 * A DISABLED ICON BUTTON CAN SAY WHY, on the same terms as Button: `disabledReason` renders through
 * ActionReason under the circle, the control becomes aria-disabled and stays focusable, and
 * activation is suppressed here. One caution that belongs to this component rather than Button: an icon button usually lives
 * in a dense toolbar where a sentence will not fit. If it will not fit, the answer is NOT to disable
 * it silently — either the act belongs at full size somewhere the reason can be read, or the act is
 * someone else's and the surface owes a `ScopeNote` instead.
 */
export function IconButton({
  children,
  size = 40,
  label,
  variant = 'surface',
  disabled = false,
  disabledReason,
  onClick,
  className,
  style,
}: WebIconButtonProps) {
  const autoId = useId();
  /* A string, an `ActionReasonSpec` or a ready node — ActionReason resolves all three, and resolves
     a spec with no sentence to nothing, which leaves the circle natively `disabled`. */
  const reason = renderActionReason(disabledReason, { id: autoId });
  const stated = disabled && reason !== null;

  const circle = (
    <button
      type="button"
      className={classNames('hg-icon-button', className)}
      data-variant={variant}
      style={{ width: size, height: size, ...style }}
      aria-label={label}
      disabled={disabled && !stated}
      aria-disabled={disabled ? true : undefined}
      aria-describedby={stated ? autoId : undefined}
      onClick={() => {
        if (disabled) {
          return;
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );

  if (!stated) {
    return circle;
  }
  return (
    <span className="hg-icon-button-column">
      {circle}
      {reason}
    </span>
  );
}
