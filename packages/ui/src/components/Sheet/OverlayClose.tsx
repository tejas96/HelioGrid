import { ShellGlyph } from '../AppShell/ShellGlyph';
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
      <ShellGlyph name="close" size="md" tone="current" />
    </button>
  );
}
