import type { GroundPoint } from './ground';
import { outlineCorners } from './outline-corners';
import type { MaskGrid } from './site-grid';

/**
 * Building outlines traced off the height map's building mask (`T-M05-002`, part g): each
 * building's cells joined side to side, its outer edge followed along the cells' sides, cut to its
 * corners, and squared to its longest walls — what the magnet pulls a drawn corner to.
 */

/** A building smaller than this is a car, a tank or a shed's shadow: never an outline. */
const OUTLINE_AREA_MIN_M2 = 12;
/** How far an outline may stray from the cells' staircase: one and a half cells. */
const SIMPLIFY_CELLS = 1.5;
/** A wall within this of the building's main way is squared to it. */
const SQUARE_WITHIN_DEG = 15;
/** Corners closer than this are one. */
const CORNER_APART_M = 0.2;
const RADIANS = Math.PI / 180;
const QUARTER_TURNS = 4;

interface Lattice {
  readonly x: number;
  readonly y: number;
}

/** The cells beside a cell, side to side, on the mask. */
function besideOf(mask: MaskGrid, at: number): number[] {
  const col = at % mask.cols;
  const row = (at - col) / mask.cols;
  const beside: number[] = [];
  if (col > 0) beside.push(at - 1);
  if (col < mask.cols - 1) beside.push(at + 1);
  if (row > 0) beside.push(at - mask.cols);
  if (row < mask.rows - 1) beside.push(at + mask.cols);
  return beside;
}

/** One building's cells: every building cell joined to `start` side to side, marked seen. */
function buildingFrom(mask: MaskGrid, start: number, seen: Uint8Array): number[] {
  const cells: number[] = [];
  const stack = [start];
  seen[start] = 1;
  while (stack.length > 0) {
    const at = stack.pop() as number;
    cells.push(at);
    for (const near of besideOf(mask, at)) {
      if (mask.cells[near] !== 1 || seen[near] === 1) continue;
      seen[near] = 1;
      stack.push(near);
    }
  }
  return cells;
}

/** The cells of each building, joined side to side (never corner to corner). */
function buildingsOf(mask: MaskGrid): number[][] {
  const seen = new Uint8Array(mask.cols * mask.rows);
  const buildings: number[][] = [];
  for (let start = 0; start < mask.cells.length; start += 1) {
    if (mask.cells[start] === 1 && seen[start] === 0)
      buildings.push(buildingFrom(mask, start, seen));
  }
  return buildings;
}

const key = (x: number, y: number) => `${x},${y}`;

function signedArea(ring: readonly Lattice[]): number {
  let twice = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i] as Lattice;
    const b = ring[(i + 1) % ring.length] as Lattice;
    twice += a.x * b.y - b.x * a.y;
  }
  return twice / 2;
}

type Sides = Map<string, Lattice[]>;

/** Each cell side with a building cell on its left and none on its right, by where it starts. */
function outerSidesOf(mask: MaskGrid, cells: readonly number[]): Sides {
  const inside = new Set(cells);
  const sides: Sides = new Map();
  const add = (from: Lattice, to: Lattice) => {
    const list = sides.get(key(from.x, from.y)) ?? [];
    list.push(to);
    sides.set(key(from.x, from.y), list);
  };
  const has = (c: number, r: number) =>
    c >= 0 && c < mask.cols && r >= 0 && r < mask.rows && inside.has(r * mask.cols + c);
  for (const at of cells) {
    const c = at % mask.cols;
    const r = (at - c) / mask.cols;
    if (!has(c, r - 1)) add({ x: c, y: r }, { x: c + 1, y: r });
    if (!has(c + 1, r)) add({ x: c + 1, y: r }, { x: c + 1, y: r + 1 });
    if (!has(c, r + 1)) add({ x: c + 1, y: r + 1 }, { x: c, y: r + 1 });
    if (!has(c - 1, r)) add({ x: c, y: r + 1 }, { x: c, y: r });
  }
  return sides;
}

/** Takes the side from `at` the walk goes on by: the left turn of the way in, where there is one. */
function nextSide(sides: Sides, from: Lattice, at: Lattice): Lattice | null {
  const choices = sides.get(key(at.x, at.y));
  if (choices === undefined) return null;
  const dx = at.x - from.x;
  const dy = at.y - from.y;
  // The left turn of the way in: (dx, dy) → (−dy, dx).
  const leftAt = choices.findIndex((c) => c.x - at.x === -dy && c.y - at.y === dx);
  const next = choices.splice(Math.max(0, leftAt), 1)[0] as Lattice;
  if (choices.length === 0) sides.delete(key(at.x, at.y));
  return next;
}

/** One closed walk along the sides, from the first side left, taking each side it walks. */
function walkFrom(sides: Sides): Lattice[] {
  const [firstKey, firstList] = sides.entries().next().value as [string, Lattice[]];
  const [x, y] = firstKey.split(',').map(Number) as [number, number];
  const start = { x, y };
  const ring: Lattice[] = [start];
  let from: Lattice = start;
  let to: Lattice | null = firstList.shift() as Lattice;
  if (firstList.length === 0) sides.delete(firstKey);
  while (to !== null && !(to.x === x && to.y === y)) {
    ring.push(to);
    const next = nextSide(sides, from, to);
    from = to;
    to = next;
  }
  return ring;
}

/**
 * The outer edge of a building's cells, along the cells' sides, the inside on the left: the walk
 * that holds the most ground (the others are its courtyards). Where two of its cells touch only at
 * a corner, the edge turns left, so they stay two shapes.
 */
function outerEdge(mask: MaskGrid, cells: readonly number[]): Lattice[] {
  const sides = outerSidesOf(mask, cells);
  let best: Lattice[] = [];
  let bestArea = 0;
  while (sides.size > 0) {
    const ring = walkFrom(sides);
    const area = signedArea(ring);
    if (area > bestArea) {
      bestArea = area;
      best = ring;
    }
  }
  return best;
}

type Way = 'along' | 'across' | 'free';

/**
 * The ring squared to its main way: the wall angles' quarter-turn mean, by length. A wall within
 * 15° of it or of its square is set straight to it; the others keep their corners.
 */
export function squaredRing(ring: readonly GroundPoint[]): GroundPoint[] {
  if (ring.length < 4) return [...ring];
  const main = mainWayOf(ring);
  const c = Math.cos(main);
  const s = Math.sin(main);
  const turned = ring.map((p) => ({ x: p.east * c + p.north * s, y: -p.east * s + p.north * c }));
  const walls = turned.map((a, i) => wallOf(a, turned[(i + 1) % turned.length] as Lattice));
  const kept: Lattice[] = [];
  turned.forEach((p, i) => {
    const corner = cornerBetween(
      p,
      walls[(i - 1 + walls.length) % walls.length] as Wall,
      walls[i] as Wall,
    );
    const last = kept[kept.length - 1];
    if (corner === null) return;
    if (last !== undefined && Math.hypot(corner.x - last.x, corner.y - last.y) < CORNER_APART_M)
      return;
    kept.push(corner);
  });
  const head = kept[0] as Lattice;
  const tail = kept[kept.length - 1] as Lattice;
  if (kept.length > 1 && Math.hypot(head.x - tail.x, head.y - tail.y) < CORNER_APART_M) kept.pop();
  if (kept.length < 3) return [...ring];
  return kept.map((p) => ({ east: p.x * c - p.y * s, north: p.x * s + p.y * c }));
}

/** The building's main way: the walls' angles, a quarter turn as one, averaged by length. */
function mainWayOf(ring: readonly GroundPoint[]): number {
  let cos = 0;
  let sin = 0;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length] as GroundPoint;
    const length = Math.hypot(b.east - a.east, b.north - a.north);
    const angle = Math.atan2(b.north - a.north, b.east - a.east) * QUARTER_TURNS;
    cos += length * Math.cos(angle);
    sin += length * Math.sin(angle);
  });
  return Math.atan2(sin, cos) / QUARTER_TURNS;
}

interface Wall {
  readonly way: Way;
  readonly x: number;
  readonly y: number;
}

const WITHIN = Math.tan(SQUARE_WITHIN_DEG * RADIANS);

/** A wall, turned to the main way: along it, across it, or neither; and its middle. */
function wallOf(a: Lattice, b: Lattice): Wall {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const way: Way = dy <= WITHIN * dx ? 'along' : dx <= WITHIN * dy ? 'across' : 'free';
  return { way, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * The corner between two walls once each is set straight: an across wall fixes its x, an along
 * wall its y. Between two walls set the same way there is no corner: they are one wall.
 */
function cornerBetween(p: Lattice, before: Wall, after: Wall): Lattice | null {
  if (before.way !== 'free' && before.way === after.way) return null;
  const across = before.way === 'across' ? before : after.way === 'across' ? after : null;
  const along = before.way === 'along' ? before : after.way === 'along' ? after : null;
  return { x: across?.x ?? p.x, y: along?.y ?? p.y };
}

/**
 * Every building's outline on the mask, biggest first: traced, cut to its corners and squared, in
 * metres east and north of the pin.
 */
export function buildingOutlinesOf(mask: MaskGrid): GroundPoint[][] {
  const cellArea = mask.stepM * mask.stepM;
  return buildingsOf(mask)
    .filter((cells) => cells.length * cellArea >= OUTLINE_AREA_MIN_M2)
    .sort((a, b) => b.length - a.length)
    .map((cells) => {
      const edge = outerEdge(mask, cells);
      const ground = edge.map((p) => ({
        east: mask.west + p.x * mask.stepM,
        north: mask.south + p.y * mask.stepM,
      }));
      return squaredRing(outlineCorners(ground, SIMPLIFY_CELLS * mask.stepM));
    })
    .filter((outline) => outline.length >= 3);
}
