import type { ReactNode } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { drawsModalMark, MODAL_TONE_GLYPH } from './Modal.logic';
import type { ModalTone } from './Modal.types';

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
  const glyph = MODAL_TONE_GLYPH[tone];
  if (!drawsModalMark(icon, tone)) {
    return null;
  }
  return (
    <span className="hg-modal-mark hg-tone" data-tone={tone}>
      {icon ?? (glyph === null ? null : <ShellGlyph name={glyph} size="md" tone="current" />)}
    </span>
  );
}
