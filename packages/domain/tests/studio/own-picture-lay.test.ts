import { describe, expect, it } from 'vitest';
import { gridAt, mapSystemOf, projected } from '../../src/studio/map-systems';
import {
  cutsOf,
  DRONE_REACH_M,
  droneLayOf,
  PIECE_PX,
  photoLayOf,
  placelessLayOf,
} from '../../src/studio/own-picture-lay';
import { type PdfPageCount, pdfPagePick } from '../../src/studio/pdf-page-pick';

/**
 * Where a picture of the company's own first lies (`T-M05-002d`). The UTM and Web Mercator points
 * are proj4 2.15's own answers for the same places, to the millimetre.
 */

const SANGLI = { latitude: 16.8367, longitude: 74.5966 };

describe('mapSystemOf', () => {
  it.each([
    [4326, { kind: 'geographic' }],
    [3857, { kind: 'mercator' }],
    [900913, { kind: 'mercator' }],
    [32601, { kind: 'utm', zone: 1, south: false }],
    [32643, { kind: 'utm', zone: 43, south: false }],
    [32660, { kind: 'utm', zone: 60, south: false }],
    [32736, { kind: 'utm', zone: 36, south: true }],
    [32661, null],
    [32600, null],
    [27700, null],
    [null, null],
  ] as const)('EPSG %s is %j', (epsg, system) => {
    expect(mapSystemOf(epsg)).toEqual(system);
  });
});

describe('projected', () => {
  it.each([
    [SANGLI, 43, false, 457023.488, 1861533.94],
    [{ latitude: -6.2, longitude: 35.75 }, 36, true, 804343.1, 9313897.662],
    [{ latitude: 0.5, longitude: -78.5 }, 17, false, 778265.778, 55318.04],
    [{ latitude: 60, longitude: 10 }, 32, false, 555776.267, 6651832.735],
    [{ latitude: 19.07, longitude: 72.88 }, 43, false, 276923.389, 2109921.656],
  ] as const)(
    '%j in UTM %s lies where proj4 puts it, within a millimetre',
    (at, zone, south, x, y) => {
      const point = projected({ kind: 'utm', zone, south }, at);
      expect(point.x).toBeCloseTo(x, 3);
      expect(point.y).toBeCloseTo(y, 3);
    },
  );

  it('puts Sangli in Web Mercator where proj4 does', () => {
    const point = projected({ kind: 'mercator' }, SANGLI);
    expect(point.x).toBeCloseTo(8304055.527, 3);
    expect(point.y).toBeCloseTo(1901824.213, 3);
  });

  it('turns a UTM grid from true north west of its middle meridian, and not on it', () => {
    // Sangli is 0.4° west of zone 43's 75° meridian: grid north leans west of true north, so true
    // north lies atan(tan 0.4034° × sin 16.84°) clockwise of it.
    expect(gridAt({ kind: 'utm', zone: 43, south: false }, SANGLI).northTurnDeg).toBeCloseTo(
      0.1168,
      3,
    );
    expect(
      gridAt({ kind: 'utm', zone: 43, south: false }, { latitude: 16, longitude: 75 }).northTurnDeg,
    ).toBeCloseTo(0, 6);
    expect(gridAt({ kind: 'mercator' }, SANGLI).northTurnDeg).toBeCloseTo(0, 6);
  });

  it('reads a Web Mercator metre as 1 / cos(latitude) of its own', () => {
    const grid = gridAt({ kind: 'mercator' }, SANGLI);
    expect(grid.unitsPerMetreX).toBeCloseTo(1 / Math.cos((SANGLI.latitude * Math.PI) / 180), 3);
  });
});

describe('droneLayOf', () => {
  /** A 5 cm map of Sangli in UTM 43, 4000 pixels a side, the pin in its middle. */
  const pin = projected({ kind: 'utm', zone: 43, south: false }, SANGLI);
  const grid = {
    width: 4000,
    height: 4000,
    originX: pin.x - 100,
    originY: pin.y + 100,
    pixelX: 0.05,
    pixelY: -0.05,
  };

  it('keeps the 200 m round the pin, in pieces whose boxes are true metres about it', () => {
    const lay = droneLayOf({ kind: 'utm', zone: 43, south: false }, grid, SANGLI);
    if (lay.kind !== 'laid') throw new Error('laid');
    expect(lay.window).toEqual({ x0: 0, y0: 0, x1: 4000, y1: 4000 });
    // UTM's scale at Sangli shrinks the ground a hair under the grid's 5 cm.
    expect(lay.metresPerPixel).toBeCloseTo(0.05, 3);
    // The map turns back by it: a hair anticlockwise.
    expect(lay.turnDeg).toBeCloseTo(-0.1168, 3);
    expect(lay.cuts).toHaveLength(16);
    const west = Math.min(...lay.cuts.map((cut) => cut.box.west));
    const north = Math.max(...lay.cuts.map((cut) => cut.box.north));
    expect(west).toBeCloseTo(-DRONE_REACH_M, 0);
    expect(north).toBeCloseTo(DRONE_REACH_M, 0);
  });

  it('never lays a map that does not reach the pin: it says how far away it is', () => {
    const away = { ...grid, originX: grid.originX + 4300 };
    const lay = droneLayOf({ kind: 'utm', zone: 43, south: false }, away, SANGLI);
    expect(lay.kind).toBe('elsewhere');
    if (lay.kind === 'elsewhere') expect(lay.distanceM / 1000).toBeCloseTo(4.2, 1);
  });

  it('keeps a map in WGS 84 degrees, its pixels turned into metres each way', () => {
    const deg = 0.05 / 111_320;
    const geo = {
      width: 4000,
      height: 4000,
      originX: SANGLI.longitude - 2000 * deg,
      originY: SANGLI.latitude + 2000 * deg,
      pixelX: deg,
      pixelY: -deg,
    };
    const lay = droneLayOf({ kind: 'geographic' }, geo, SANGLI);
    if (lay.kind !== 'laid') throw new Error('laid');
    // A degree of longitude is shorter by cos(latitude): the same pixels cover fewer metres east.
    const widest = Math.max(...lay.cuts.map((cut) => cut.box.east));
    expect(widest).toBeLessThan(DRONE_REACH_M);
    expect(lay.turnDeg).toBeCloseTo(0, 6);
  });
});

describe('cutsOf, placelessLayOf and photoLayOf', () => {
  it.each([
    [1024, 1024, 1],
    [1025, 1024, 2],
    [2048, 2049, 6],
    [1, 1, 1],
  ] as const)('a %s × %s window is %s pieces of at most PIECE_PX a side', (w, h, count) => {
    const cuts = cutsOf({ x0: 0, y0: 0, x1: w, y1: h }, { x: 0, y: 0 }, { x: 1, y: 1 });
    expect(cuts).toHaveLength(count);
    for (const { window } of cuts) {
      expect(window.x1 - window.x0).toBeLessThanOrEqual(PIECE_PX);
      expect(window.y1 - window.y0).toBeLessThanOrEqual(PIECE_PX);
    }
  });

  it('lays a photo on the pin at its assumed size, its boxes in pixels, y up', () => {
    const lay = photoLayOf(4000, 3000);
    expect(lay.metresPerPixel).toBeCloseTo(30 / 4000, 9);
    expect(lay.cuts[0]?.box).toEqual({ west: -2000, east: -976, north: 1500, south: 476 });
  });

  it.each([
    [0.05, 1, 16],
    [0.01, 2, 100],
    [0.005, 4, 100],
  ] as const)(
    'a %s m map is read at a step of %s, in %s pieces at most 1024 px after the step',
    (pixel, step, count) => {
      const grid = {
        width: 100_000,
        height: 100_000,
        originX: 0,
        originY: 0,
        pixelX: pixel,
        pixelY: -pixel,
      };
      const lay = placelessLayOf(grid);
      expect(lay.step).toBe(step);
      expect(lay.cuts).toHaveLength(count);
    },
  );

  it('lays a map with no place round its middle, at its own scale', () => {
    const lay = placelessLayOf({
      width: 10000,
      height: 10000,
      originX: 0,
      originY: 0,
      pixelX: 0.1,
      pixelY: -0.1,
    });
    expect(lay.window).toEqual({ x0: 4000, y0: 4000, x1: 6000, y1: 6000 });
    expect(lay.metresPerPixel).toBe(0.1);
  });
});

describe('pdfPagePick', () => {
  const page = (count: Partial<PdfPageCount> & { page: number }): PdfPageCount => ({
    closedLines: 0,
    longLines: 0,
    words: 0,
    pictureShare: 0,
    namesRoof: false,
    namesPlan: false,
    ...count,
  });

  it('a builder’s brochure: its plans are pictures, and the terrace plan beats the floors and the spec table', () => {
    // The real 8-page brochure as the reader counted it.
    const pages = [
      page({ page: 1, closedLines: 4, longLines: 12, words: 25 }),
      page({ page: 2, closedLines: 5, longLines: 16, words: 14, pictureShare: 0.69 }),
      page({ page: 3, closedLines: 47, longLines: 142, words: 328, pictureShare: 0.24 }),
      page({
        page: 4,
        closedLines: 7,
        longLines: 30,
        words: 34,
        pictureShare: 0.73,
        namesPlan: true,
      }),
      page({
        page: 5,
        closedLines: 7,
        longLines: 32,
        words: 47,
        pictureShare: 0.7,
        namesPlan: true,
      }),
      page({
        page: 8,
        closedLines: 8,
        longLines: 33,
        words: 33,
        pictureShare: 0.69,
        namesPlan: true,
        namesRoof: true,
      }),
    ];
    expect(pdfPagePick(pages)).toEqual({ page: 8, kind: 'picture' });
  });

  it('a CAD plan printed to PDF is laid as lines', () => {
    expect(pdfPagePick([page({ page: 1, closedLines: 326, longLines: 122, words: 1 })])).toEqual({
      page: 1,
      kind: 'lines',
    });
  });

  it('a drawn roof plan beats a drawn floor plan with more lines', () => {
    const pages = [
      page({ page: 1, closedLines: 900, longLines: 600, words: 30 }),
      page({ page: 2, closedLines: 200, longLines: 100, words: 30, namesRoof: true }),
    ];
    expect(pdfPagePick(pages)).toEqual({ page: 2, kind: 'lines' });
  });

  it.each([
    ['a letter', [page({ page: 1, longLines: 4, words: 400 })]],
    ['a photo with no plan named', [page({ page: 1, pictureShare: 0.9 })]],
    ['no page', []],
  ] as const)('%s is no plan', (_, pages) => {
    expect(pdfPagePick(pages)).toBeNull();
  });
});
