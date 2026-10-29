import type { CSSProperties } from 'react';
import { useId, useImperativeHandle, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text/Text';
import { ReasonExplainer } from '../ActionReason';
import { reasonPage } from '../ActionReason/ActionReason.logic';
import type { ReasonTriggerProps } from '../ActionReason/ActionReason.types';
import type { FocusHandle } from '../SearchField/SearchField.types';
import type { ButtonProps } from './Button.types';

interface WebButtonProps extends ButtonProps {
  className?: string;
  /** Lands on the pill — the DS contract for `style`. */
  style?: CSSProperties;
}

/**
 * Primary action is near-black — the strongest identity marker. Always pill-shaped.
 *
 * A DISABLED BUTTON CAN SAY WHY. `disabledReason` is the sentence — the precondition half of
 * MS4-15's "when unavailable the control STATES THE REASON" — and it opens in the Explainer bubble
 * above the pill (`ReasonExplainer`), never as a line under it. With a reason the button is
 * `aria-disabled` and STAYS FOCUSABLE, its act suppressed and its press opening the bubble: a native
 * `disabled` leaves the tab order, and `aria-describedby` on an unreachable element is never
 * announced — so the keyboard user who most needs the sentence is the one who cannot get to it.
 * `disabled` with no reason keeps the native attribute; there is nothing to go and hear.
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
  reasonOpen,
  loading = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  tone,
  expanded,
  spokenName,
  ref,
  onClick,
  className,
  style,
}: WebButtonProps) {
  const reasonId = useId();
  const element = useRef<FocusHandle | null>(null);
  /* One turn late, as the native half: a caller asks in the turn it closes an overlay or redraws
     this button, and the element to focus is the one drawn after it. */
  useImperativeHandle(
    ref,
    () => ({ focus: () => setTimeout(() => element.current?.focus(), 0) }),
    [],
  );
  /* A spec with no sentence opens nothing and describes nothing, so the pill keeps the native
     `disabled` attribute. */
  const stated = disabled && reasonPage(disabledReason) !== '';
  const toned = variant === 'secondary' || variant === 'ghost' ? tone : undefined;

  const pill = (reason?: ReasonTriggerProps) => (
    <button
      ref={(node) => {
        element.current = node;
        reason?.ref?.(node);
      }}
      type="button"
      className={classNames('hg-button', className)}
      data-variant={variant}
      data-size={size}
      data-tone={toned}
      data-full-width={fullWidth ? 'true' : undefined}
      data-stated={stated ? 'true' : undefined}
      style={style}
      disabled={disabled && !stated}
      aria-disabled={disabled ? true : undefined}
      aria-describedby={reason?.describedBy}
      aria-expanded={expanded ?? reason?.expanded}
      aria-busy={loading ? true : undefined}
      aria-label={spokenName}
      onClick={() => {
        if (reason !== undefined) {
          reason.onPress();
          return;
        }
        // A working button sends nothing more: its first press is still out.
        if (disabled || loading) {
          return;
        }
        onClick?.();
      }}
    >
      {loading ? (
        /* The spinner is drawn for the eye; the words stay for a screen reader, so a button that is
           working keeps its name (`F7-26`). */
        <>
          <span className="hg-button-spinner" aria-hidden="true" />
          <Text as="span" spokenOnly>
            {children}
          </Text>
        </>
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
    return pill();
  }
  return (
    <ReasonExplainer spec={disabledReason} id={reasonId} open={reasonOpen} block={fullWidth}>
      {pill}
    </ReasonExplainer>
  );
}
