import { describe, expect, it } from 'vitest';
import { studioDocumentSchema } from '../src';

/**
 * The design document on the wire (`T-M05-002`, part b): roofs and the picture's scale are new
 * fields of schema 1. A document saved before them reads as no roofs at scale 1, and a roof whose
 * edges cross is never stored. A roof's height came after the first roofs: one without it stands at
 * the market's storey height, set by the system.
 */
/** A refusal of an outsized body takes no longer than this: no pair-by-pair walk of its edges. */
const QUICK_MS = 1_000;
/** The ring the outsized roof's corners stand on, in metres. */
const RING_M = 500;
const OLD = { schemaVersion: 1, picture: null, drawnOn: null };
/** A document saved before part d carries neither key, and reads back with neither. */
const NO_OWN = {};
const corners = [
  { east: 0, north: 0 },
  { east: 8, north: 0 },
  { east: 8, north: 6 },
  { east: 0, north: 6 },
];
const roof = {
  id: '6f1e8c2a-0b7d-4c35-9a51-0d8f3b2e7c41',
  corners,
  edges: ['typed', 'traced', 'traced', 'measured'],
  tracedOn: 'sky',
};

const LAID = {
  pictureId: '01a50000-0000-7000-8000-0000000000aa',
  at: { east: 1.5, north: -2 },
  turnDeg: -15,
  metresPerUnit: 0.001,
  scaleFrom: 'file',
};
const PLAN = { ...LAID, seeThrough: 80, locked: false, hidden: false, page: 2 };

describe('the design document on the wire', () => {
  it('reads a picture of the company’s own and a plan as sent, a plan edge as an edge', () => {
    const sent = {
      ...OLD,
      roofs: [{ ...roof, edges: ['plan', 'plan', 'plan', 'plan'], height: null }],
      pictureScale: 1,
      ownPicture: LAID,
      plan: PLAN,
    };
    expect(studioDocumentSchema.parse(sent)).toEqual(sent);
  });

  it('an answer for a document saved before part d carries no new key, which an older reader would refuse', () => {
    const read = studioDocumentSchema.parse({ ...OLD, roofs: [], pictureScale: 1 });
    expect(Object.keys(read)).not.toContain('ownPicture');
    expect(Object.keys(read)).not.toContain('plan');
  });

  it.each([
    ['a turn of −180°, which is +180°', { plan: { ...PLAN, turnDeg: -180 } }],
    ['a turn past 180°', { plan: { ...PLAN, turnDeg: 185 } }],
    ['a plan seen through at 5%', { plan: { ...PLAN, seeThrough: 5 } }],
    ['a plan seen through past 100%', { plan: { ...PLAN, seeThrough: 105 } }],
    ['page 0', { plan: { ...PLAN, page: 0 } }],
    ['a picture with no scale', { ownPicture: { ...LAID, metresPerUnit: 0 } }],
    ['a scale from no known source', { ownPicture: { ...LAID, scaleFrom: 'drone' } }],
    ['a picture with a field of the plan', { ownPicture: { ...LAID, locked: true } }],
  ])('refuses %s', (_why, change) => {
    expect(studioDocumentSchema.safeParse({ ...OLD, ...change }).success).toBe(false);
  });

  it('a document saved before roofs reads as no roofs, at the picture’s own scale', () => {
    expect(studioDocumentSchema.parse(OLD)).toEqual({
      ...OLD,
      roofs: [],
      pictureScale: 1,
      ...NO_OWN,
    });
  });

  it('a roof sent before heights reads as standing at the system’s height', () => {
    const sent = { ...OLD, roofs: [roof], pictureScale: 1.04 };
    expect(studioDocumentSchema.parse(sent)).toEqual({
      ...sent,
      roofs: [{ ...roof, height: null }],
      ...NO_OWN,
    });
  });

  it.each([
    ['set by a person', { metres: 4.5, setBy: 'person' }],
    ['set by the system', { metres: 3, setBy: 'system' }],
    ['none', null],
  ])('a roof with a height %s reads as sent', (_why, height) => {
    const sent = { ...OLD, roofs: [{ ...roof, height }], pictureScale: 1, ...NO_OWN };
    expect(studioDocumentSchema.parse(sent)).toEqual(sent);
  });

  it.each([
    ['edges that cross', { ...roof, corners: [corners[0], corners[2], corners[1], corners[3]] }],
    [
      'an edge count that is not the corner count',
      { ...roof, edges: ['traced', 'traced', 'traced'] },
    ],
    ['two corners', { ...roof, corners: corners.slice(0, 2), edges: ['traced', 'traced'] }],
    [
      'a corner past 2 km',
      { ...roof, corners: [...corners.slice(0, 3), { east: 2_001, north: 6 }] },
    ],
    [
      'a corner that is not a number',
      { ...roof, corners: [...corners.slice(0, 3), { east: Number.NaN, north: 6 }] },
    ],
    ['an unknown trust', { ...roof, edges: ['traced', 'traced', 'traced', 'guessed'] }],
    ['a field it does not know', { ...roof, slope: 3 }],
    ['a bare number for a height', { ...roof, height: 3 }],
    ['a height under 0.3 m', { ...roof, height: { metres: 0.29, setBy: 'person' } }],
    ['a height over 300 m', { ...roof, height: { metres: 300.01, setBy: 'person' } }],
    ['a height set by no one it knows', { ...roof, height: { metres: 3, setBy: 'ai' } }],
    [
      'more corners than a roof may have',
      {
        ...roof,
        corners: Array.from({ length: 101 }, (_, i) => ({ east: Math.cos(i), north: Math.sin(i) })),
        edges: Array.from({ length: 101 }, () => 'traced'),
      },
    ],
  ])('a roof with %s is refused', (_why, bad) => {
    expect(studioDocumentSchema.safeParse({ ...OLD, roofs: [bad] }).success).toBe(false);
  });

  it.each([
    [0.19, false],
    [0.2, true],
    [5, true],
    [5.01, false],
  ])('a picture scale of %s reads: %s', (pictureScale, reads) => {
    expect(studioDocumentSchema.safeParse({ ...OLD, pictureScale }).success).toBe(reads);
  });

  it('a body with far more corners than a roof may have is refused by its count, at once', () => {
    const many = 20_000;
    const outsized = {
      ...roof,
      // A clean ring of corners, round a circle in order: its edges never cross.
      corners: Array.from({ length: many }, (_, i) => ({
        east: RING_M * Math.cos((2 * Math.PI * i) / many),
        north: RING_M * Math.sin((2 * Math.PI * i) / many),
      })),
      edges: Array.from({ length: many }, () => 'traced'),
    };
    const started = performance.now();
    expect(studioDocumentSchema.safeParse({ ...OLD, roofs: [outsized] }).success).toBe(false);
    expect(performance.now() - started).toBeLessThan(QUICK_MS);
  });
});
