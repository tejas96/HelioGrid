import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { landFocusOn } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button/Button';
import { Toast } from '../Toast/Toast';
import { shownToasts } from './ToastHost.logic';
import type { ToastHostProps, ToastItem } from './ToastHost.types';

/** A caller's offset rides in as a custom property so the placement rules stay in ToastHost.css. */
type HostVars = CSSProperties & Record<`--${string}`, string>;

type WebToastHostProps = ToastHostProps & {
  className?: string;
  style?: CSSProperties;
};

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
      <ShellGlyphMarks name="close" />
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
  dismissLabel,
  focusAfter,
  position = 'bottom-center',
  max = 3,
  duration = 4000,
  offset,
  className,
  style,
}: WebToastHostProps) {
  const shown = useMemo(() => shownToasts(toasts, max), [toasts, max]);
  /* The pointer and the keyboard pause the queue apart: one leaving never restarts the clock while
     the other still holds a toast. */
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const host = useRef<HTMLDivElement>(null);
  const oldest: ToastItem | undefined = shown[0];
  /* A pressed Undo or dismiss leaves with its toast, and a removed element fires no blur: the press
     itself lets the queue run again. */
  const leave = (id: ToastItem['id']) => {
    setFocused(false);
    onDismiss?.(id);
  };

  useEffect(() => {
    /* A toast dropped from the stack under the keyboard fires no blur: the stack no longer holding
       the focus lets the queue run again. */
    if (focused && !host.current?.contains(document.activeElement)) {
      setFocused(false);
      return;
    }
    if (paused || onDismiss === undefined || oldest === undefined) {
      return;
    }
    const id = oldest.id;
    const timer = setTimeout(() => onDismiss(id), oldest.duration ?? duration);
    return () => clearTimeout(timer);
  }, [oldest, paused, focused, onDismiss, duration]);

  if (shown.length === 0) {
    return null;
  }

  /* Unset unless a caller asks: an always-written property beats the stylesheet's own default,
     which is the nav-derived one. */
  const vars: HostVars | undefined =
    offset === undefined ? undefined : { '--hg-toast-host-offset': `${offset}px` };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the DS pauses the queue under the pointer, and while the keyboard is on a toast's act (an Undo must outlive the time it takes to Tab there); the stack is not a control and every toast keeps its own semantics.
    <div
      aria-live="polite"
      aria-atomic="false"
      data-position={position}
      className={classNames('hg-toast-host', className)}
      style={{ ...vars, ...style }}
      ref={host}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
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
              (toast.undo === undefined || onDismiss === undefined ? undefined : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    leave(toast.id);
                    toast.undo?.onUndo();
                    if (toast.undo !== undefined) landFocusOn(toast.undo.focusAfter);
                  }}
                >
                  {toast.undo.label}
                </Button>
              )) ??
              toast.action ??
              (onDismiss === undefined ? undefined : (
                <Pressable
                  className="hg-toast-host-dismiss"
                  accessibilityLabel={dismissLabel}
                  onPress={() => {
                    leave(toast.id);
                    if (focusAfter !== undefined) landFocusOn(focusAfter);
                  }}
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
