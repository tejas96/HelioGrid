import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderActionReason } from '../ActionReason';
import type { ButtonProps } from './Button.types';

interface WebButtonProps extends ButtonProps {
  className?: string;
  /** Lands on the pill, never on the reason column — the DS contract for `style`. */
  style?: CSSProperties;
}

/**
 * Primary action is near-black — the strongest identity marker. Always pill-shaped.
 *
 * A DISABLED BUTTON CAN SAY WHY. `disabledReason` is the sentence, rendered by ActionReason directly
 * under the pill — the precondition half of MS4-15's "when unavailable the control STATES THE
 * REASON". Two things come with it, both deliberate:
 *
 *   1. The button becomes a COLUMN (pill, then reason). `style` still lands on the pill, so a
 *      caller's width or margin behaves as before.
 *   2. With a reason the button is `aria-disabled` and STAYS FOCUSABLE, activation suppressed here.
 *      A native `disabled` leaves the tab order, and `aria-describedby` on an unreachable element is
 *      never announced — so the keyboard user who most needs the sentence is the one who cannot get
 *      to it. `disabled` with no reason keeps the native attribute; there is nothing to go and hear.
 *
 * Where the act is ABSENT rather than off, this is the wrong component: don't render a button at all
 * and let the surface carry a `ScopeNote`.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  disabledReason,
  loading = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  onClick,
  className,
  style,
}: WebButtonProps) {
  const autoId = useId();
  /* ActionReason owns the barred-circle glyph, the type floor and the neutral tint, and it resolves
     a string, a spec or a ready node. A spec with no sentence resolves to nothing, and then there is
     no description to point at — so the pill keeps the native `disabled` attribute. */
  const reason = renderActionReason(disabledReason, { id: autoId });
  const stated = disabled && reason !== null;

  const pill = (
    <button
      type="button"
      className={classNames('hg-button', className)}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth ? 'true' : undefined}
      data-stated={stated ? 'true' : undefined}
      style={style}
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
      {loading ? (
        <span className="hg-button-spinner" aria-hidden="true" />
      ) : (
        <>
          {icon}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );

  if (!stated) {
    return pill;
  }
  return (
    <span className="hg-button-column" data-full-width={fullWidth ? 'true' : undefined}>
      {pill}
      {reason}
    </span>
  );
}
