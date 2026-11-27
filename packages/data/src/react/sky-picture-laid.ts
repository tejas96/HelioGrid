import type { SkyPicturePiece, SkyPictureWire } from '@heliogrid/contracts';
import { boxWithoutStrip, creditStripOf } from '@heliogrid/domain';

/** The sky picture as the ground lays it (`skyLaidOf`). */
export interface SkyLaid {
  readonly creditStrip: number;
  readonly pieces: readonly SkyPicturePiece[];
  readonly around: readonly SkyPicturePiece[];
}

/**
 * The sky picture as the ground lays it: the share of each piece's foot that carries the
 * provider's credit, cut off, and the pieces' boxes without it, so what is left lies where it was
 * photographed. Worked once per read: the ground is drawn again only when the picture changes.
 */
export function skyLaidOf(sky: Extract<SkyPictureWire, { kind: 'picture' }>): SkyLaid {
  const creditStrip = creditStripOf(sky.source);
  const cut = (piece: SkyPicturePiece) => boxWithoutStrip(piece, creditStrip);
  return { creditStrip, pieces: sky.pieces.map(cut), around: (sky.around ?? []).map(cut) };
}
