import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { ModalTone } from './Modal.types';

/** The glyph each tone draws. `success` is a tick, so it takes no ring around it. */
export const MODAL_TONE_GLYPH: Record<ModalTone, ShellGlyphName | null> = {
  neutral: null,
  danger: 'alert-circle',
  warning: 'alert-circle',
  success: 'tick-long',
};

/**
 * `neutral` draws nothing unless the caller hands an `icon` — a decision with no weight to it gets
 * no mark at all.
 */
export function drawsModalMark(icon: ReactNode, tone: ModalTone): boolean {
  return icon !== undefined || MODAL_TONE_GLYPH[tone] !== null;
}
