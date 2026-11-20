import { describe, expect, it } from 'vitest';
import { OPENING_VIEW, STUDIO_VIEWS, viewsOffered } from '../../src/studio/views';

describe('the views on offer', () => {
  it('opens on the flat top view', () => {
    expect(OPENING_VIEW).toBe('top');
  });

  it('before a roof: the top view open, 3D waiting for a roof, no side view', () => {
    expect(viewsOffered(false)).toEqual([
      { view: 'top', lock: null },
      { view: '3d', lock: 'needs_roof' },
    ]);
  });

  it('with a roof: every view open', () => {
    expect(viewsOffered(true)).toEqual(STUDIO_VIEWS.map((view) => ({ view, lock: null })));
  });
});
