// @vitest-environment happy-dom

import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readSiteInPlace, type SiteReaders } from '../../src/react/site-readers';
import { box, opened, scanned, TRACED } from './lidar-origin';
import { stored } from './studio-document-origin';
import { settle } from './studio-origin';

/**
 * LiDAR through the real client (`T-M05-002g`, board v17): the button opens the 3D with the scan;
 * a roof drawn on the leaning sky picture is found where the scan sees its building; Match moves it
 * there in one save, and Undo takes it back; Esc closes Move, then LiDAR; the top view turns it off;
 * a reader sees a roof's card and changes nothing; no height data keeps the button off.
 */

describe('LiDAR in the 3D view', () => {
  it('the button opens the 3D with the scan; roofs off their spot are said, and Fix picks them', async () => {
    const view = await opened();
    expect(view.result.current.focus(false).lidar).toBe('shown');
    act(() => view.result.current.lidar.moves.toggle());
    expect(view.result.current.view).toBe('3d');
    expect(view.result.current.lidar.view.on).toBe(true);
    expect(view.result.current.lidar.scan).toBe('coming');
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    expect(view.result.current.lidar.mesh?.indices.length).toBeGreaterThan(0);
    await waitFor(() => expect(view.result.current.lidar.foot).toEqual({ kind: 'off_spot' }));
    act(() => view.result.current.lidar.moves.fix());
    expect(view.result.current.lidar.picked).toEqual([0]);
    const status = view.result.current.lidar.status;
    expect(status?.kind === 'off' && status.shift?.east).toBeCloseTo(3, 1);
  });

  it('Match the scan moves the roof there and hands its height to the scan, in one save; Undo takes it back', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    act(() => view.result.current.lidar.moves.tapRoof(0));
    await waitFor(() => expect(view.result.current.lidar.canMatch).toBe(true));
    act(() => view.result.current.lidar.moves.match());
    await waitFor(() => expect(stored.saves).toHaveLength(1));
    const moved = stored.saves[0]?.roofs[0];
    expect(moved?.corners[0]?.east).toBeCloseTo(3, 1);
    expect(moved?.corners[0]?.north).toBeCloseTo(2, 1);
    await waitFor(() => expect(view.result.current.lidar.status).toEqual({ kind: 'matches' }));
    act(() => view.result.current.moves.undo());
    expect(view.result.current.document?.roofs[0]?.corners).toEqual(TRACED.corners);
  });

  it('Esc closes Move first, then turns LiDAR off; the top view turns it off too', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    act(() => view.result.current.lidar.moves.move());
    const back = () => {
      let taken = false;
      act(() => {
        taken = view.result.current.moves.back();
      });
      return taken;
    };
    expect(back()).toBe(true);
    expect(view.result.current.lidar.view.move).toBeNull();
    expect(back()).toBe(true);
    expect(view.result.current.lidar.view.on).toBe(false);
    act(() => view.result.current.lidar.moves.toggle());
    act(() => view.result.current.moves.see('top'));
    expect(view.result.current.lidar.view.on).toBe(false);
  });

  it('a drag shows the roof where it is held, and saves once when it ends', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    act(() => view.result.current.lidar.moves.tapRoof(0));
    act(() => view.result.current.lidar.moves.drag({ east: 0.7, north: 0 }, false));
    expect(view.result.current.lidar.hint).toEqual({ kind: 'moving', metres: 0.7 });
    expect(stored.saves).toHaveLength(0);
    act(() => view.result.current.lidar.moves.drag({ east: 1.4, north: 0 }, true));
    await waitFor(() => expect(stored.saves).toHaveLength(1));
    expect(view.result.current.lidar.foot).toEqual({ kind: 'moved', metres: 1.4 });
    expect(stored.saves[0]?.roofs[0]?.corners[0]?.east).toBeCloseTo(1.4, 2);
  });

  it('a reader’s tap shows the roof’s card; nothing is saved', async () => {
    const view = await opened(false);
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.hint).toEqual({ kind: 'reader' }));
    act(() => view.result.current.lidar.moves.tapRoof(0));
    expect(view.result.current.lidar.card?.heightM).toBe(4);
    act(() => view.result.current.lidar.moves.match());
    expect(stored.saves).toHaveLength(0);
  });

  it('no height data at this place: LiDAR says so and shows no scan', async () => {
    const view = await opened(true, { ...scanned(), source: 'openstreetmap', areas: [] });
    expect(view.result.current.lidar.scan).toBe('none');
  });

  it('a drag that is cancelled moves nothing and saves nothing', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    act(() => view.result.current.lidar.moves.tapRoof(0));
    act(() => view.result.current.lidar.moves.drag({ east: 2, north: 0 }, false));
    act(() => view.result.current.lidar.moves.drag({ east: 0, north: 0 }, true));
    expect(view.result.current.lidar.hint).toEqual({ kind: 'drag' });
    expect(view.result.current.document?.roofs[0]?.corners).toEqual(TRACED.corners);
    expect(stored.saves).toHaveLength(0);
  });

  it('a scan whose maths broke says so, and Try again asks again', async () => {
    let broken = true;
    const once: SiteReaders = {
      ...readSiteInPlace,
      scan: async (layers) => (broken ? null : readSiteInPlace.scan(layers)),
    };
    const view = await opened(true, scanned(), once);
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('failed'));
    broken = false;
    act(() => view.result.current.lidar.moves.retryScan());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
  });

  it('on the straight-down picture the top view says roofs sit off; Fix in LiDAR opens Move on them', async () => {
    const view = await opened();
    expect(view.result.current.lidar.topFix).toBe(false);
    act(() => view.result.current.site.showStraightDown(true));
    await waitFor(() => expect(view.result.current.lidar.topFix).toBe(true));
    act(() => view.result.current.lidar.moves.fixInLidar());
    expect(view.result.current.view).toBe('3d');
    expect(view.result.current.lidar.view.on).toBe(true);
    expect(view.result.current.lidar.picked).toEqual([0]);
    expect(view.result.current.lidar.topFix).toBe(false);
  });

  it('the magnet pulls a drag that comes near the scan onto it', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    act(() => view.result.current.lidar.moves.tapRoof(0));
    await waitFor(() => expect(view.result.current.lidar.status?.kind).toBe('off'));
    act(() => view.result.current.lidar.moves.drag({ east: 2.5, north: 1.6 }, false));
    expect(view.result.current.lidar.hint).toEqual({ kind: 'on_scan' });
    act(() => view.result.current.lidar.moves.drag({ east: 2.5, north: 1.6 }, true));
    await waitFor(() => expect(stored.saves).toHaveLength(1));
    expect(stored.saves[0]?.roofs[0]?.corners[0]?.east).toBeCloseTo(3, 1);
    expect(stored.saves[0]?.roofs[0]?.corners[0]?.north).toBeCloseTo(2, 1);
  });

  it('a press with no move, or a cancel, moves nothing even within the magnet’s reach', async () => {
    // Traced 50 cm and 40 cm off the scan's building: the magnet would pull it there on a drag.
    const near = { ...TRACED, corners: box(2.5, 1.6, 12.5, 9.6) };
    const view = await opened(true, scanned(), readSiteInPlace, near);
    act(() => view.result.current.lidar.moves.toggle());
    act(() => view.result.current.lidar.moves.tapRoof(0));
    await waitFor(() => expect(view.result.current.lidar.status?.kind).toBe('off'));
    act(() => view.result.current.lidar.moves.drag({ east: 0, north: 0 }, true));
    await settle();
    expect(view.result.current.document?.roofs[0]?.corners).toEqual(near.corners);
    expect(stored.saves).toHaveLength(0);
  });
});
