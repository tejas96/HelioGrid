import { describe, expect, it } from 'vitest';
import { SCAN_TRIANGLES_MAX, scanMeshOf, scanThinning } from '../../src/studio/site-scan-mesh';
import { gridOf } from './site-support';

/**
 * LiDAR's scan as one lit mesh (`T-M05-002g`, step 5): every cell of the grids at its own
 * sharpness within the phone's budget of triangles, normals that face the sky on flat ground, holes
 * where the data has none, and the metre grid left out under the sharp one.
 */

describe('the scan’s mesh', () => {
  it('a flat grid: two triangles a cell, every normal straight up', () => {
    const mesh = scanMeshOf([{ grid: gridOf(10, 1, () => 2), skip: null }]);
    expect(mesh.indices.length / 3).toBe(9 * 9 * 2);
    for (let v = 0; v < mesh.normals.length; v += 3) expect(mesh.normals[v + 1]).toBeCloseTo(1, 6);
    expect(mesh.positions[1]).toBe(2);
  });

  it('north is the scene’s −z, east its +x', () => {
    const mesh = scanMeshOf([{ grid: gridOf(10, 1, () => 0), skip: null }]);
    // The first vertex is the south-west cell's middle: 4.5 m west and south of the pin.
    expect([mesh.positions[0], mesh.positions[2]]).toEqual([-4.5, 4.5]);
  });

  it('a wall leans its normals sideways', () => {
    const mesh = scanMeshOf([{ grid: gridOf(10, 1, (p) => (p.east > 0 ? 6 : 0)), skip: null }]);
    const sideways = Array.from(
      { length: mesh.normals.length / 3 },
      (_, v) => mesh.normals[v * 3] ?? 0,
    );
    expect(Math.min(...sideways)).toBeLessThan(-0.5);
  });

  it('a cell with no height leaves a hole, never a spike', () => {
    const mesh = scanMeshOf([
      { grid: gridOf(10, 1, (p) => (p.east > 3 ? Number.NaN : 1)), skip: null },
    ]);
    expect(mesh.indices.length / 3).toBeLessThan(9 * 9 * 2);
    expect(mesh.positions.every((value) => Number.isFinite(value))).toBe(true);
  });

  it('the metre grid leaves out what the sharp one draws, and sits under it', () => {
    const sharp = { grid: gridOf(10, 0.5, () => 3), skip: null };
    const around = {
      grid: gridOf(40, 1, () => 3),
      skip: { west: -5, east: 5, south: -5, north: 5 },
    };
    const both = scanMeshOf([sharp, around]);
    const alone = scanMeshOf([{ ...around, skip: null }]);
    expect(both.indices.length).toBeLessThan(
      scanMeshOf([sharp]).indices.length + alone.indices.length,
    );
    const sharpVertices = 20 * 20;
    expect(both.positions[sharpVertices * 3 + 1]).toBeCloseTo(2.96, 6);
  });
});

describe('the budget a phone draws smoothly', () => {
  it.each([
    ['within it: every cell', 300, 1],
    ['just over: every second cell', 400, 2],
    ['far over: thinner still', 1_200, 4],
  ])('%s', (_, side, every) => {
    const layer = { grid: { ...gridOf(1, 1, () => 0), cols: side, rows: side }, skip: null };
    expect(scanThinning([layer])).toBe(every);
  });

  it('a 100 m sharp grid and its metre surround stay under the budget', () => {
    const sharp = { grid: gridOf(100, 0.25, () => 1), skip: null };
    const around = {
      grid: gridOf(300, 1, () => 1),
      skip: { west: -50, east: 50, south: -50, north: 50 },
    };
    const mesh = scanMeshOf([sharp, around]);
    expect(mesh.indices.length / 3).toBeLessThanOrEqual(SCAN_TRIANGLES_MAX);
  });
});
