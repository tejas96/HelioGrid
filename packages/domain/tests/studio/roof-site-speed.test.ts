import { describe, expect, it } from 'vitest';
import { cornerDragged } from '../../src/studio/roof-edit';
import { roofAreaM2, roofsAreaM2 } from '../../src/studio/roof-free-ground';
import { roofFloorM } from '../../src/studio/roof-levels';
import { meetingOf } from '../../src/studio/roof-meet';
import { roofMoved } from '../../src/studio/roof-move';
import { edgesOf } from '../../src/studio/roof-open-edges';
import { setbackLines } from '../../src/studio/roof-setback';
import { SNAP_REACH_MAX_M, snapTargetsOf } from '../../src/studio/roof-snap';
import { draftSpot } from '../../src/studio/roof-snap-spot';
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

const SITE = designOf(
  ...Array.from({ length: HOUSES }, (_, i) => {
    const west = (i % ACROSS) * PITCH;
    const south = Math.floor(i / ACROSS) * PITCH;
    return [
      roofOf(`house-${i}`, box(west, south, 10, 8)),
      stairOn(box(west, south, 3, 3), `house-${i}`),
    ];
  }).flat(),
);

/** The site as a drag leaves it: a new list of roofs, so nothing worked out for the last one is reused. */
function wholeSite(): number {
  const site = { ...SITE, roofs: [...SITE.roofs] };
  let sum = roofsAreaM2(site);
  site.roofs.forEach((_, index) => {
    sum += roofAreaM2(site, index) + roofFloorM(site, index, FACTS);
    sum += edgesOf(site, index, FACTS).length + setbackLines(site, index, FACTS).length;
  });
  return sum;
}

describe('200 roofs worked out together', () => {
  it('the site holds 200 roofs', () => {
    expect(SITE.roofs).toHaveLength(2 * HOUSES);
  });

  it('every roof’s parapets, setback and area, and the site’s area, within a quarter of a felt wait', () => {
    wholeSite();
    const started = Date.now();
    const RUNS = 3;
    for (let i = 0; i < RUNS; i++) wholeSite();
    expect((Date.now() - started) / RUNS).toBeLessThan(FELT_MS / SLOWER);
  });

  it('one roof’s share — what a dragged corner works out again — within a frame on that phone', () => {
    const one = () => {
      const site = { ...SITE, roofs: [...SITE.roofs] };
      return (
        edgesOf(site, 0, FACTS).length + setbackLines(site, 0, FACTS).length + roofAreaM2(site, 0)
      );
    };
    one();
    const started = Date.now();
    const RUNS = 50;
    for (let i = 0; i < RUNS; i++) one();
    expect((Date.now() - started) / RUNS).toBeLessThan(FRAME_MS / SLOWER);
  });

  it('a new roof placed among 200 is met within a frame on that phone', () => {
    const place = () => meetingOf(SITE, box(4, 3, 2, 2), FACTS).kind;
    expect(place()).toBe('stair_room');
    const started = Date.now();
    const RUNS = 20;
    for (let i = 0; i < RUNS; i++) place();
    expect((Date.now() - started) / RUNS).toBeLessThan(FRAME_MS / SLOWER);
  });

  // A pointer move while drawing asks the magnet once, for the spot; the draft's view and the bar
  // check the spot where it stands. A drag step asks once for the corner or the roof in hand.
  const PER_MOVE = 1;
  const timed = (run: () => unknown, runs: number) => {
    run();
    const started = Date.now();
    for (let i = 0; i < runs; i++) run();
    return (Date.now() - started) / runs;
  };

  /** 200 roofs of ten corners, each turned a little more than the last: no two walls share a line. */
  const TURNED = designOf(
    ...Array.from({ length: 2 * HOUSES }, (_, i) => {
      const turn = (i * 0.7 * Math.PI) / 180;
      const corners = Array.from({ length: 10 }, (_, k) => {
        const at = (k / 10) * 2 * Math.PI + turn;
        return {
          east: (i % 20) * PITCH + 5 * Math.cos(at),
          north: Math.floor(i / 20) * PITCH + 5 * Math.sin(at),
        };
      });
      return roofOf(`turned-${i}`, corners);
    }),
  );

  it('the magnet over 200 roofs: a pointer move while drawing within a frame on that phone', () => {
    const targets = snapTargetsOf(TURNED.roofs);
    const drawn = [
      { east: -20, north: -20 },
      { east: -10, north: -20 },
    ];
    const ms = timed(
      () => draftSpot(drawn, { east: 10.2, north: 0.3 }, targets, true, SNAP_REACH_MAX_M),
      20,
    );
    expect(ms * PER_MOVE).toBeLessThan(FRAME_MS / SLOWER);
  });

  it('the magnet over 200 roofs: a corner dragged and a roof moved, each within a frame on that phone', () => {
    const corner = timed(() => cornerDragged(TURNED, 0, 1, { east: 5.2, north: 0.3 }, true), 20);
    const moved = timed(() => roofMoved(TURNED, 0, { east: 0.3, north: 0.3 }, []), 20);
    expect(corner).toBeLessThan(FRAME_MS / SLOWER);
    expect(moved).toBeLessThan(FRAME_MS / SLOWER);
  });
});
