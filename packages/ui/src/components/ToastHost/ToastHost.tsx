import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { Toast } from '../Toast/Toast';
import type { ToastHostProps, ToastItem } from './ToastHost.types';

/** A caller's offset rides in as a custom property so the placement rules stay in ToastHost.css. */
type HostVars = CSSProperties & Record<`--${string}`, string>;

interface WebToastHostProps extends ToastHostProps {
  className?: string;
  style?: CSSProperties;
}

function DismissGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * The container Toast needs. Holds the queue, stacks at most `max` at once (older ones drop, they
 * don't pile up over a phone screen), auto-dismisses, and pauses the timer while the pointer is
 * over the stack. Sits above the bottom nav.
 *
 * THE DISMISS IS 44×44 — the Pressable primitive owns that floor. The extra 12px is taken back as
 * negative margin, so no toast grew.
 */
export function ToastHost({
  toasts = [],
  onDismiss,
  position = 'bottom-center',
  max = 3,
  duration = 4000,
  offset,
  className,
  style,
}: WebToastHostProps) {
  const shown = useMemo(() => toasts.slice(-max), [toasts, max]);
  const [paused, setPaused] = useState(false);
  const oldest: ToastItem | undefined = shown[0];

  useEffect(() => {
    if (paused || onDismiss === undefined || oldest === undefined) {
      return;
    }
    const id = oldest.id;
    const timer = setTimeout(() => onDismiss(id), oldest.duration ?? duration);
    return () => clearTimeout(timer);
  }, [oldest, paused, onDismiss, duration]);

  if (shown.length === 0) {
    return null;
  }

  /* Unset unless a caller asks: an always-written property beats the stylesheet's own default,
     which is the nav-derived one. */
  const vars: HostVars | undefined =
    offset === undefined ? undefined : { '--hg-toast-host-offset': `${offset}px` };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the DS pauses the queue under the pointer; the stack is not a control and every toast keeps its own semantics.
    <div
      aria-live="polite"
      aria-atomic="false"
      data-position={position}
      className={classNames('hg-toast-host', className)}
      style={{ ...vars, ...style }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {shown.map((toast) => (
        <div key={toast.id} className="hg-toast-host-item">
          <Toast
            className="hg-toast-host-card"
            tone={toast.tone}
            title={toast.title}
            description={toast.description}
            icon={toast.icon}
            action={
              toast.action ??
              (onDismiss === undefined ? undefined : (
                <Pressable
                  className="hg-toast-host-dismiss"
                  accessibilityLabel="Dismiss"
                  onPress={() => onDismiss(toast.id)}
                >
                  <DismissGlyph />
                </Pressable>
              ))
            }
          />
        </div>
      ))}
    </div>
  );
}
