import { describe, expect, it } from 'vitest';
import { meetingOf } from '../../src/studio/roof-meet';
import { meetingOfRoof, roofCutToEdge } from '../../src/studio/roof-meet-standing';
import { box, designOf, FACTS, p, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * Join's one outline, a roof across both arms of another, and how a roof already standing meets
 * the others (`T-M05-002`, part e).
 */
describe('Join is offered where the two make one outline', () => {
  const BAR = roofOf('bar', box(0, 6, 12, 5));

  it('a stem under a bar: Join names the bar, and the one outline is the T', () => {
    const meeting = meetingOf(designOf(BAR), box(4, 0, 4, 6), FACTS);
    expect(meeting.joinWith).toBe(0);
    expect(meeting.joined).toHaveLength(8);
    expect(meeting.choices).toContain('join');
  });

  it('a bar that closes a U would leave a hole in the one roof: no Join', () => {
    const u = roofOf('u', [
      p(0, 0),
      p(12, 0),
      p(12, 8),
      p(8, 8),
      p(8, 3),
      p(4, 3),
      p(4, 8),
      p(0, 8),
    ]);
    const meeting = meetingOf(designOf(u), box(0, 8, 12, 3), FACTS);
    expect(meeting.place).toBe('beside');
    expect(meeting.joinWith).toBeNull();
    expect(meeting.joined).toBeNull();
    expect(meeting.choices).toEqual(['building', 'open_shed']);
  });

  it('a roof apart joins none', () => {
    expect(meetingOf(designOf(BAR), box(40, 40, 4, 4), FACTS).joined).toBeNull();
  });
});

describe('an upper floor across both arms of a C', () => {
  const C = roofOf('c', [
    p(0, 0),
    p(12, 0),
    p(12, 3),
    p(4, 3),
    p(4, 9),
    p(12, 9),
    p(12, 12),
    p(0, 12),
  ]);

  it.each([
    ['over both arms and the gap between them', box(8, 0, 4, 12), true],
    ['over one arm and out past its edge', box(8, 0, 6, 3), false],
  ])('%s', (_why, drawn, across) => {
    const meeting = meetingOf(designOf(C), drawn, FACTS);
    expect(meeting.place).toBe('partly_over');
    expect(meeting.across).toBe(across);
  });
});

describe('a roof already standing, met again', () => {
  const stair = stairOn(box(0, 0, 3, 3));
  const design = designOf(TERRACE, stair, SHED);

  it('the stair room on its roof is still inside it: it does not meet itself', () => {
    expect(meetingOfRoof(design, 1, stair.corners, FACTS)).toMatchObject({
      place: 'inside',
      kind: 'stair_room',
      on: 0,
    });
  });

  it('the terrace does not lie under its own stair room: it meets only the shed, named by its place in the design', () => {
    expect(meetingOfRoof(design, 0, TERRACE.corners, FACTS)).toMatchObject({
      place: 'beside',
      startsLike: 2,
      on: null,
    });
  });

  it('the stair room dragged off every roof stands apart', () => {
    expect(meetingOfRoof(design, 1, box(40, 40, 3, 3), FACTS).place).toBe('apart');
  });

  it('Cut to edge trims a roof to the others’ edge, never to its own', () => {
    const over = designOf(TERRACE, roofOf('new', box(9.3, 0, 4.7, 8)));
    const cut = roofCutToEdge(over, 1) ?? [];
    expect(cut).toContainEqual(p(10, 0));
    expect(cut).not.toContainEqual(p(9.3, 0));
  });

  it('a roof that is not there is cut to nothing', () => {
    expect(roofCutToEdge(design, 9)).toBeNull();
  });
});
