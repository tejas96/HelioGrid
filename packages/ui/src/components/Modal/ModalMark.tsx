import type { ReactNode } from 'react';
import type { ModalTone } from './Modal.types';

/** The glyph each tone draws. `success` is a tick, so it takes no ring around it. */
const TONE_PATH: Record<ModalTone, string | null> = {
  neutral: null,
  danger: 'M12 9v4M12 17h.01',
  warning: 'M12 9v4M12 17h.01',
  success: 'M20 6 9 17l-5-5',
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
  const path = TONE_PATH[tone];
  if (icon === undefined && path === null) {
    return null;
  }
  return (
    <span className="hg-modal-mark" data-tone={tone}>
      {icon ?? (
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
          <path d={path ?? undefined} />
          {tone === 'success' ? null : <circle cx="12" cy="12" r="9" />}
        </svg>
      )}
    </span>
  );
}
