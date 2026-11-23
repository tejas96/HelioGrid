import { describe, expect, it } from 'vitest';
import { roofAreaM2, roofsAreaM2, setbackLines } from '../../src/studio/roof-free-ground';
import { roofFloorM } from '../../src/studio/roof-levels';
import { meetingOf } from '../../src/studio/roof-meet';
import { edgesOf } from '../../src/studio/roof-open-edges';
import { box, designOf, FACTS, roofOf, stairOn } from './roof-meet-support';

/**
 * The whole site worked out together at the roof cap (`T-M05-002`, part e): 100 houses, each with
 * a stair room — every roof's parapets, setback line and area, and the site's area. A phone four
 * times slower than this machine must stay smooth while a corner is dragged, so the whole site is
 * held to a quarter of the time a person feels as a wait, and one roof's share of it to a frame.
 */
const HOUSES = 100;
const ACROSS = 10;
const PITCH = 14;
/** A person feels a wait past this many milliseconds; a phone four times slower gets a quarter. */
const FELT_MS = 400;
const SLOWER = 4;
const FRAME_MS = 16;

const site = designOf(
  ...Array.from({ length: HOUSES }, (_, i) => {
    const west = (i % ACROSS) * PITCH;
    const south = Math.floor(i / ACROSS) * PITCH;
    return [
      roofOf(`house-${i}`, box(west, south, 10, 8)),
      stairOn(box(west, south, 3, 3), `house-${i}`),
    ];
  }).flat(),
);

function wholeSite(): number {
  let sum = roofsAreaM2(site);
  site.roofs.forEach((_, index) => {
    sum += roofAreaM2(site, index) + roofFloorM(site, index, FACTS);
    sum += edgesOf(site, index, FACTS).length + setbackLines(site, index, FACTS).length;
  });
  return sum;
}

describe('200 roofs worked out together', () => {
  it('the site holds 200 roofs', () => {
    expect(site.roofs).toHaveLength(2 * HOUSES);
  });

  it('every roof’s parapets, setback and area, and the site’s area, within a quarter of a felt wait', () => {
    wholeSite();
    const started = Date.now();
    const RUNS = 3;
    for (let i = 0; i < RUNS; i++) wholeSite();
    expect((Date.now() - started) / RUNS).toBeLessThan(FELT_MS / SLOWER);
  });

  it('one roof’s share — what a dragged corner works out again — within a frame on that phone', () => {
    const one = () =>
      edgesOf(site, 0, FACTS).length + setbackLines(site, 0, FACTS).length + roofAreaM2(site, 0);
    one();
    const started = Date.now();
    const RUNS = 50;
    for (let i = 0; i < RUNS; i++) one();
    expect((Date.now() - started) / RUNS).toBeLessThan(FRAME_MS / SLOWER);
  });

  it('a new roof placed among 200 is met within a frame on that phone', () => {
    const place = () => meetingOf(site, box(4, 3, 2, 2), FACTS).kind;
    expect(place()).toBe('stair_room');
    const started = Date.now();
    const RUNS = 20;
    for (let i = 0; i < RUNS; i++) place();
    expect((Date.now() - started) / RUNS).toBeLessThan(FRAME_MS / SLOWER);
  });
});
