import { describe, expect, it } from 'vitest';
import { type PictureStamp, pictureUpdatedOver } from '../../src/studio/document';

/**
 * "Picture updated · check the outline" (`T-M05-002d`, board 5.1): the picture the roofs were drawn
 * on is newer now — the sky picture for roofs drawn on it, your own for roofs drawn on yours.
 */
const sky = (takenOn: string | null): PictureStamp => ({ source: 'google', takenOn });
const own = (takenOn: string | null): PictureStamp => ({ source: 'own', takenOn });

describe('pictureUpdatedOver', () => {
  it.each([
    ['drawn on the sky picture, a newer one', sky('2025-01-01'), '2026-01-01', null, true],
    ['drawn on the sky picture, the same day', sky('2026-01-01'), '2026-01-01', null, false],
    [
      'drawn on the sky picture, your newer photo laid',
      sky('2025-01-01'),
      null,
      '2026-01-01',
      false,
    ],
    ['drawn on your photo, a newer photo of your own', own('2025-01-01'), null, '2026-01-01', true],
    ['drawn on your photo, an older one', own('2026-01-01'), null, '2025-01-01', false],
    ['drawn on your photo, a newer sky picture', own('2025-01-01'), '2026-01-01', null, false],
    ['drawn on your photo, the new one undated', own('2025-01-01'), null, null, false],
    ['drawn on an undated photo', own(null), null, '2026-01-01', false],
    ['nothing drawn yet', null, '2026-01-01', '2026-01-01', false],
  ] as const)('%s: %s', (_why, drawnOn, skyTakenOn, ownTakenOn, updated) => {
    expect(pictureUpdatedOver(drawnOn, skyTakenOn, ownTakenOn)).toBe(updated);
  });
});
