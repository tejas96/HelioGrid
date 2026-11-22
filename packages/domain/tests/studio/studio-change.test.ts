import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import { studioChangeOf } from '../../src/studio/studio-change';
import { drawn, p } from './roof-step-run';

/** What one change did, so Undo and Redo can name it (`T-M05-002`, part b). */

const roof = drawn.roofs[0] as Roof;
const shed: Roof = {
  ...roof,
  id: 'shed',
  corners: roof.corners.map((c) => p(c.east + 20, c.north)),
};
const two: StudioDocument = { ...drawn, roofs: [roof, shed] };

describe('the change between two designs', () => {
  it.each([
    // before, after → the change
    ['a roof drawn', drawn, two, 'roof_added'],
    ['a roof deleted', two, drawn, 'roof_deleted'],
    ['the picture picked', drawn, { ...drawn, picture: 'none' }, 'picture'],
    ['the picture sized', drawn, { ...drawn, pictureScale: 1.2 }, 'size'],
    [
      'a height set',
      drawn,
      { ...drawn, roofs: [{ ...roof, height: { metres: 6, setBy: 'person' } }] },
      'height',
    ],
    [
      'a corner moved',
      drawn,
      { ...drawn, roofs: [{ ...roof, corners: [p(0, 0), p(9, 0), p(8, 6), p(0, 6)] }] },
      'shape',
    ],
    ['nothing a person sees', EMPTY_STUDIO_DOCUMENT, EMPTY_STUDIO_DOCUMENT, 'other'],
  ] as const)('%s: %s', (_why, before, after, change) => {
    expect(studioChangeOf(before as StudioDocument, after as StudioDocument)).toBe(change);
  });
});
