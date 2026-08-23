/* SourceDocument's chrome (web): the paging/fit controls, the state panel, and the plain button
   that opens the real file.

   The fit controls (fit width / fit whole page) say which one is in force, and they say it through
   the primitive: `accessibilityState.selected` is `aria-pressed` here and
   `accessibilityState.selected` on the native half, one declaration for both, with the 44×44 floor
   and the focus ring coming from `hg-pressable` rather than a second copy of the numbers. */

import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';

export function Chrome({ children }: { children: ReactNode }) {
  return <span className="hg-source-doc-chrome">{children}</span>;
}

export function IconBtn({
  label,
  path,
  onClick,
  disabled,
  pressed,
}: {
  label: string;
  path: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <Pressable
      className="hg-source-doc-icon-btn"
      accessibilityLabel={label}
      accessibilityState={{ selected: pressed }}
      disabled={disabled}
      onPress={onClick}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    </Pressable>
  );
}

/** A preview is never the only way to see a file, so this renders as a link when there is a URL. */
export function PlainButton({
  children,
  onClick,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <a
        className="hg-source-doc-plain"
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className="hg-source-doc-plain" onClick={onClick}>
      {children}
    </button>
  );
}

export function Message({
  tone,
  title,
  message,
  action,
}: {
  tone?: 'warning';
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="hg-source-doc-message" data-tone={tone ?? 'neutral'}>
      <span className="hg-source-doc-message-mark">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {tone === 'warning' ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </>
          ) : (
            <>
              <path d="M14 3v5h5" />
              <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z" />
            </>
          )}
        </svg>
      </span>
      <span className="hg-source-doc-message-title">{title}</span>
      {/* --text-tertiary measures 4.478:1 on --canvas-sunken, under the 4.5 floor: this panel is a
          THIRD background, so 12px words on it take --text-secondary. */}
      {message ? <span className="hg-source-doc-message-body">{message}</span> : null}
      {action}
    </div>
  );
}
