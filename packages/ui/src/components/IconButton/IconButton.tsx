import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { ReasonExplainer } from '../ActionReason';
import type { ReasonTriggerProps } from '../ActionReason/ActionReason.types';
import { isStatedOff } from '../Button/Button.logic';
import type { IconButtonProps } from './IconButton.types';

interface WebIconButtonProps extends IconButtonProps {
  className?: string;
  /** Lands on the circle — the DS contract for `style`. */
  style?: CSSProperties;
}

/**
 * Perfect-circle icon button. White fill + e1 at rest.
 *
 * A DISABLED ICON BUTTON CAN SAY WHY, on the same terms as Button: `disabledReason` opens in the
 * Explainer bubble above the circle (`ReasonExplainer`), the control becomes aria-disabled and stays
 * focusable, and its press opens the bubble instead of the act. A spec with no sentence leaves the
 * circle natively `disabled`.
 */
export function IconButton({
  children,
  size = 40,
  label,
  variant = 'surface',
  disabled = false,
  disabledReason,
  reasonOpen,
  onClick,
  className,
  style,
}: WebIconButtonProps) {
  const reasonId = useId();
  const stated = isStatedOff(disabled, disabledReason);

  const circle = (reason?: ReasonTriggerProps) => (
    <button
      ref={reason?.ref}
      type="button"
      className={classNames('hg-icon-button', className)}
      data-variant={variant}
      style={{ width: size, height: size, ...style }}
      aria-label={label}
      disabled={disabled && !stated}
      aria-disabled={disabled ? true : undefined}
      aria-describedby={reason?.describedBy}
      aria-expanded={reason?.expanded}
      onClick={() => {
        if (reason !== undefined) {
          reason.onPress();
          return;
        }
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
    return circle();
  }
  return (
    <ReasonExplainer spec={disabledReason} id={reasonId} open={reasonOpen}>
      {circle}
    </ReasonExplainer>
  );
}
