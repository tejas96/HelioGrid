// @vitest-environment happy-dom

import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { opened } from './lidar-origin';
import { stored } from './studio-document-origin';
import { settle } from './studio-origin';

/**
 * LiDAR's sliders through the real client (`T-M05-002g`): the map's height and a roof's height
 * move the scene while held and save once when let go; a hold handed back to the saved value (a
 * touch taken back) lets the preview go, and the same value is never saved twice.
 */
describe('LiDAR’s sliders', () => {
  it('the map’s height shows while its slider is held, and saves once when let go', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    const saves = stored.saves.length;
    act(() => view.result.current.lidar.moves.liftMap(1.2, false));
    expect(view.result.current.lidar.lineUp.lift).toBeCloseTo(1.2, 5);
    expect(stored.saves).toHaveLength(saves);
    act(() => view.result.current.lidar.moves.liftMap(1.5, true));
    await waitFor(() => expect(stored.saves).toHaveLength(saves + 1));
    expect(view.result.current.lidar.lineUp.lift).toBeCloseTo(1.5, 5);
  });

  it('a roof’s height shows while its slider is held, and saves once when let go', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    act(() => view.result.current.lidar.moves.tapRoof(0));
    await waitFor(() => expect(view.result.current.lidar.heightRoof).not.toBeNull());
    const saves = stored.saves.length;
    // The model is drawn from LiDAR's preview: the roof's top rises with the held height.
    const topOf = () => view.result.current.scene.levels[0]?.topM ?? 0;
    const was = topOf();
    act(() => view.result.current.lidar.moves.setHeight(6.5, false));
    expect(topOf() - was).toBeCloseTo(2.5, 5);
    expect(stored.saves).toHaveLength(saves);
    act(() => view.result.current.lidar.moves.setHeight(7, true));
    await waitFor(() => expect(stored.saves).toHaveLength(saves + 1));
    expect(stored.saves.at(-1)?.roofs[0]?.height?.metres).toBeCloseTo(7, 5);
  });

  it('a hold handed back to the saved height lets the preview go; the same height is never saved twice', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    act(() => view.result.current.lidar.moves.tapRoof(0));
    await waitFor(() => expect(view.result.current.lidar.heightRoof).not.toBeNull());
    const saves = stored.saves.length;
    const topOf = () => view.result.current.scene.levels[0]?.topM ?? 0;
    const was = topOf();
    const saved = view.result.current.lidar.heightRoof?.heightM ?? 0;
    // A touch taken back (a scroll): the slider hands the saved height back, nothing is saved.
    act(() => view.result.current.lidar.moves.setHeight(6.5, false));
    act(() => view.result.current.lidar.moves.setHeight(saved, false));
    expect(topOf()).toBeCloseTo(was, 5);
    // The blur after a release sends the same height again: one save, not two.
    act(() => view.result.current.lidar.moves.setHeight(7, true));
    await waitFor(() => expect(stored.saves).toHaveLength(saves + 1));
    act(() => view.result.current.lidar.moves.setHeight(7, true));
    await settle();
    expect(stored.saves).toHaveLength(saves + 1);
    expect(topOf() - was).toBeCloseTo(7 - saved, 5);
  });

  it('a lift handed back to the saved one lets the preview go, and is not saved again', async () => {
    const view = await opened();
    act(() => view.result.current.lidar.moves.toggle());
    await waitFor(() => expect(view.result.current.lidar.scan).toBe('in'));
    const saved = view.result.current.lidar.lineUp.lift;
    act(() => view.result.current.lidar.moves.liftMap(1.2, false));
    act(() => view.result.current.lidar.moves.liftMap(saved, false));
    expect(view.result.current.lidar.lineUp.lift).toBeCloseTo(saved, 5);
    // Let go, the map follows its arrows again: no held line-up stands over it.
    const east = view.result.current.lidar.lineUp.east;
    act(() => view.result.current.site.nudgeMap({ east: 1, north: 0 }));
    await waitFor(() => expect(view.result.current.lidar.lineUp.east).toBeGreaterThan(east));
    await settle();
    const saves = stored.saves.length;
    act(() => view.result.current.lidar.moves.liftMap(saved, true));
    await settle();
    expect(stored.saves).toHaveLength(saves);
  });
});
