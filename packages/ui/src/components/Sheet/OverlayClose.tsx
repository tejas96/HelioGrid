import type { OverlayCloseProps } from './OverlayClose.types';

/**
 * The 44×44 dismissal shared by Sheet, Modal and DetailPanel. Under a handle the web draws the same
 * header as the phone, so `handle` pulls only sideways here too. Hover is a background tint only, so
 * nothing about the control is hover-only: the glyph, the target and the name are always present.
 */
export function OverlayClose({ onClick, offset = 'sheet', label }: OverlayCloseProps) {
  return (
    <button
      aria-label={label}
      className="hg-overlay-close"
      data-offset={offset}
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        width="20"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
