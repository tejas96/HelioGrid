// @vitest-environment happy-dom

import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, DESIGNS_ROLE, designId, mountedOver, origin, SANGLI } from './studio-origin';

/** The sun and its shade live in 3D: the top view never keeps the sun bar open. */
describe('the sun in the studio', () => {
  it('opens in the 3D view and closes when the view goes back to the top', async () => {
    origin.designs = [aDesign(1)];
    origin.roles = [DESIGNS_ROLE];
    origin.site = { ...origin.site, pin: SANGLI.pin };
    stored.document = {
      ...stored.document,
      roofs: [
        {
          id: '01a50000-0000-7000-8000-000000000921',
          corners: [
            { east: 0, north: 0 },
            { east: 10, north: 0 },
            { east: 10, north: 8 },
            { east: 0, north: 8 },
          ],
          edges: ['traced', 'traced', 'traced', 'traced'],
          tracedOn: 'sky',
          height: { metres: 4, setBy: 'person' },
        },
      ],
    };
    const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
    await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(1));
    act(() => view.result.current.moves.see('3d'));
    act(() => view.result.current.moves.openSun());
    expect(view.result.current.view).toBe('3d');
    expect(view.result.current.sunBar.view).not.toBeNull();
    act(() => view.result.current.moves.see('top'));
    expect(view.result.current.view).toBe('top');
    expect(view.result.current.sunBar.view).toBeNull();
  });
});
