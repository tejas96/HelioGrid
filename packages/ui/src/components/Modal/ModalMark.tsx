import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { ModalTone } from './Modal.types';

/** The glyph each tone draws. `success` is a tick, so it takes no ring around it. */
const TONE_GLYPH: Record<ModalTone, ShellGlyphName | null> = {
  neutral: null,
  danger: 'alert-circle',
  warning: 'alert-circle',
  success: 'tick-long',
};

interface ModalMarkProps {
  icon?: ReactNode;
  tone: ModalTone;
}

/**
 * The leading circular icon tint. `neutral` draws nothing unless the caller hands an `icon` — a
 * decision with no weight to it gets no mark at all.
 *
 * The tint carries the weight; the primary button stays near-black unless the action is genuinely
 * destructive, in which case the caller reaches for `variant="destructive"`.
 */
export function ModalMark({ icon, tone }: ModalMarkProps) {
  const glyph = TONE_GLYPH[tone];
  if (icon === undefined && glyph === null) {
    return null;
  }
  return (
    <span className="hg-modal-mark" data-tone={tone}>
      {icon ??
        (glyph === null ? null : (
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
            <ShellGlyphMarks name={glyph} />
          </svg>
        ))}
    </span>
  );
}
