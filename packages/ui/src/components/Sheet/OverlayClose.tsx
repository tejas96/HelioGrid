/** Sheet and DetailPanel pull the button back by 8/10; Modal's roomier header by 10/12. */
export type OverlayCloseOffset = 'sheet' | 'modal';

interface OverlayCloseProps {
  onClick?: () => void;
  offset?: OverlayCloseOffset;
  /**
   * The accessible name. Hardcoded "Close" in the reference implementation and no prop on any of
   * the three public contracts carries it, so the default stays here rather than becoming an API
   * this family's `.d.ts` files do not declare.
   */
  label?: string;
}

/**
 * The 44×44 dismissal shared by Sheet, Modal and DetailPanel. Hover is a background tint only, so
 * nothing about the control is hover-only: the glyph, the target and the name are always present.
 */
export function OverlayClose({ onClick, offset = 'sheet', label = 'Close' }: OverlayCloseProps) {
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
