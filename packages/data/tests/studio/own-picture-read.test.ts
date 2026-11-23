import { describe, expect, it } from 'vitest';
import {
  dronePlan,
  dxfRead,
  METRES_PER_POINT_AT_1_100,
  pdfPageOf,
  pdfPlan,
  photoPlan,
  readerOf,
  toServer,
} from '../../src/studio/own-picture-read';

/**
 * Your picture's reading, the part both platforms share (`T-M05-002d`): which reader a file takes,
 * where a picture first lies, what a DXF holds, and which PDF page is laid. A platform's reader only
 * draws the pixels these decide.
 */

const SANGLI = { latitude: 16.8367, longitude: 74.5966 };
/** Sangli's pin in UTM 43, as proj4 puts it. */
const PIN_UTM = { x: 457023.488, y: 1861533.94 };
const bytesOf = (text: string) => new TextEncoder().encode(text);

describe('readerOf', () => {
  it.each([
    ['roof.JPG', 'photo'],
    ['roof.jpeg', 'photo'],
    ['roof.png', 'photo'],
    ['roof.webp', 'photo'],
    ['map.tif', 'drone'],
    ['map.TIFF', 'drone'],
    ['plans.pdf', 'pdf'],
    ['house.dxf', 'dxf'],
    ['house.dwg', 'dwg'],
    ['house.heic', null],
    ['notes.txt', null],
    ['no-end', null],
  ] as const)('%s is read as %s', (name, reader) => {
    expect(readerOf(name)).toBe(reader);
  });
});

describe('photoPlan', () => {
  it('lays a photo on the pin at our guess, its long side 30 m', () => {
    const plan = photoPlan(3000, 2000);
    expect(plan.lay).toEqual({
      at: { east: 0, north: 0 },
      turnDeg: 0,
      metresPerUnit: 0.01,
      scaleFrom: 'guess',
    });
    expect(plan.cuts).toHaveLength(6);
  });

  it('takes a page picture’s own guess when it has one', () => {
    expect(photoPlan(1000, 800, 0.02).lay.metresPerUnit).toBe(0.02);
  });
});

describe('dronePlan', () => {
  const grid = {
    width: 4000,
    height: 4000,
    originX: PIN_UTM.x - 100,
    originY: PIN_UTM.y + 100,
    pixelX: 0.05,
    pixelY: -0.05,
  };

  it('lays a UTM map in its place, its boxes true metres about the pin', () => {
    const plan = dronePlan({ epsg: 32643, metric: true, grid }, SANGLI);
    if (plan.kind !== 'cut') throw new Error('refused');
    expect(plan.lay).toMatchObject({
      at: { east: 0, north: 0 },
      metresPerUnit: 1,
      scaleFrom: 'file',
    });
    expect(plan.facts.centre).toEqual(SANGLI);
    expect(plan.facts.metresPerUnit).toBeCloseTo(0.05, 3);
  });

  it('refuses a map of another place, with how far it is', () => {
    const plan = dronePlan(
      { epsg: 32643, metric: true, grid: { ...grid, originX: grid.originX + 4300 } },
      SANGLI,
    );
    expect(plan.kind).toBe('refused');
    if (plan.kind === 'refused') expect(plan.read).toMatchObject({ refusal: 'elsewhere' });
  });

  it('lays a metre map of a system we do not read on the pin, with no place', () => {
    const plan = dronePlan({ epsg: 27700, metric: true, grid }, SANGLI);
    if (plan.kind !== 'cut') throw new Error('refused');
    expect(plan.facts).toMatchObject({ centre: null, turnDeg: null });
  });

  it('refuses a map it can neither place nor scale', () => {
    const plan = dronePlan({ epsg: null, metric: false, grid }, SANGLI);
    expect(plan.kind === 'refused' && plan.read).toEqual({
      kind: 'refused',
      refusal: 'not_a_picture',
    });
  });
});

describe('dxfRead', () => {
  const dxf = (units: number | null) =>
    [
      '0',
      'SECTION',
      '2',
      'HEADER',
      ...(units === null ? [] : ['9', '$INSUNITS', '70', String(units)]),
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'ENTITIES',
      '0',
      'LWPOLYLINE',
      '90',
      '4',
      '70',
      '1',
      '10',
      '0',
      '20',
      '0',
      '10',
      '7790',
      '20',
      '0',
      '10',
      '7790',
      '20',
      '7600',
      '10',
      '0',
      '20',
      '7600',
      '0',
      'ENDSEC',
      '0',
      'EOF',
      '',
    ].join('\n');

  it('reads a plan with its unit, laid on the pin at the file’s scale', () => {
    const read = dxfRead(bytesOf(dxf(4)));
    if (read.kind !== 'read') throw new Error(read.kind);
    expect(read.facts).toMatchObject({ unit: 'mm', unitGuess: null, metresPerUnit: 0.001 });
    expect(read.lay).toMatchObject({ turnDeg: 0, metresPerUnit: 0.001, scaleFrom: 'file' });
    // Its middle lies on the pin.
    expect(read.lay.at.east).toBeCloseTo(-3.895, 9);
    expect(read.lay.at.north).toBeCloseTo(-3.8, 9);
    expect(read.parts).toHaveLength(1);
  });

  it('guesses the unit of a plan that names none, from its size, and says it is a guess', () => {
    const read = dxfRead(bytesOf(dxf(null)));
    if (read.kind !== 'read') throw new Error(read.kind);
    expect(read.facts).toMatchObject({ unit: null, unitGuess: 'mm', metresPerUnit: null });
    expect(read.lay.scaleFrom).toBe('guess');
  });

  it.each([
    [
      'a binary DXF goes to our server',
      [...bytesOf('AutoCAD Binary DXF\r\n'), 0x1a, 0x00],
      'server',
    ],
    ['a broken one is refused as broken', [...bytesOf('X\nSECTION\n')], 'refused'],
  ] as const)('%s', (_, bytes, kind) => {
    expect(dxfRead(Uint8Array.from(bytes)).kind).toBe(kind);
  });

  it('refuses a text DXF whose lines would pass one stored file, saying it has too many lines', () => {
    const line = (k: number) => [
      '0',
      'LINE',
      '10',
      `${k}.123456`,
      '20',
      `${k * 3}.654321`,
      '11',
      `${k + 7}.5`,
      '21',
      `${k}.25`,
    ];
    const many = Array.from({ length: 40_000 }, (_, k) => line(k)).flat();
    const text = ['0', 'SECTION', '2', 'ENTITIES', ...many, '0', 'ENDSEC', '0', 'EOF', ''];
    expect(dxfRead(bytesOf(text.join('\n')))).toEqual({
      kind: 'refused',
      refusal: 'too_many_lines',
    });
  });

  it('refuses a CAD plan past 20 MB', () => {
    expect(toServer(new Uint8Array(20_000_001), 'image/vnd.dwg')).toEqual({
      kind: 'refused',
      refusal: 'too_large',
    });
    expect(toServer(new Uint8Array(20_000_000), 'image/vnd.dwg').kind).toBe('server');
  });
});

describe('pdfPageOf and pdfPlan', () => {
  const wall = (x: number) => ({ points: [x, 0, x, 500], closed: false });
  const room = { points: [0, 0, 400, 0, 400, 300, 0, 300], closed: true };

  it('counts a page: its outlines, its walls, its words and what it names', () => {
    const page = pdfPageOf(
      2,
      [room, wall(100), { points: [0, 0, 1, 1], closed: false }],
      'Terrace plan · 1:100',
      0,
      700,
    );
    expect(page.count).toEqual({
      page: 2,
      closedLines: 1,
      longLines: 2,
      words: 4,
      pictureShare: 0,
      namesRoof: true,
      namesPlan: true,
    });
  });

  it('lays the drawn page as a plan at 1:100, every drawn page kept for ‹ ›', () => {
    const walls = Array.from({ length: 50 }, (_, i) => wall(i * 10));
    const read = pdfPlan([
      pdfPageOf(1, [wall(0)], 'Cover', 0, 700),
      pdfPageOf(2, [room, ...walls], 'Ground floor plan', 0, 700),
    ]);
    if (read.kind !== 'read') throw new Error(read.kind);
    expect(read.facts).toMatchObject({ pages: 2, pickedPage: 2 });
    expect(read.parts.map((part) => part.page)).toEqual([1, 2]);
    expect(read.lay.metresPerUnit).toBe(METRES_PER_POINT_AT_1_100);
  });

  it('hands a picture page to the platform to draw', () => {
    expect(pdfPlan([pdfPageOf(1, [], 'First floor plan', 0.7, 700)])).toEqual({
      kind: 'picture',
      page: 1,
      pages: 1,
    });
  });

  it('refuses a PDF with no plan in it', () => {
    expect(pdfPlan([pdfPageOf(1, [], 'A letter with many words in it', 0, 700)])).toEqual({
      kind: 'refused',
      refusal: 'no_plan',
    });
  });
});
