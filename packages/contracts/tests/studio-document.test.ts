import { describe, expect, it } from 'vitest';
import { studioDocumentSchema } from '../src';

/**
 * The design document on the wire (`T-M05-002`, part b): roofs and the picture's scale are new
 * fields of schema 1. A document saved before them reads as no roofs at scale 1, and a roof whose
 * edges cross is never stored.
 */
/** A refusal of an outsized body takes no longer than this: no pair-by-pair walk of its edges. */
const QUICK_MS = 1_000;
/** The ring the outsized roof's corners stand on, in metres. */
const RING_M = 500;
const OLD = { schemaVersion: 1, picture: null, drawnOn: null };
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

describe('the design document on the wire', () => {
  it('a document saved before roofs reads as no roofs, at the picture’s own scale', () => {
    expect(studioDocumentSchema.parse(OLD)).toEqual({ ...OLD, roofs: [], pictureScale: 1 });
  });

  it('a document with a roof reads as sent', () => {
    const sent = { ...OLD, roofs: [roof], pictureScale: 1.04 };
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
    ['a field it does not know', { ...roof, height: 3 }],
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
