import { describe, expect, it } from 'vitest';
import { COPY_GAP_M } from '../../src/studio/roof-step-copy';
import { box, designOf, p, SHED, stairOn, TERRACE } from './roof-meet-support';
import { run, saidOf } from './roof-step-support';

/**
 * Copy and Delete (`T-M05-002`, part e): each takes what stands on the roof with it, is one change
 * with Undo, and the line names the roof.
 */
describe('Copy and Delete, from a roof’s row', () => {
  const stair = stairOn(box(0, 0, 3, 3));
  const design = designOf(TERRACE, stair, SHED);

  it('Copy: the roof and what stands on it land beside it, cutting nothing, and the copy is picked', () => {
    const { state, document, commits } = run(
      [{ kind: 'copy_roof', roof: 0, ids: ['copy', 'copy-stair'] }],
      design,
    );
    expect(commits).toBe(1);
    expect(document.roofs.map((roof) => roof.id)).toEqual([
      'terrace',
      'stair',
      'shed',
      'copy',
      'copy-stair',
    ]);
    // East of the terrace stands the shed: the copy goes south, a gap clear of it.
    expect(document.roofs[3]?.corners[0]).toEqual(p(0, -(8 + COPY_GAP_M)));
    expect(document.roofs[4]).toMatchObject({ on: 'copy', kind: { is: 'stair_room' } });
    expect(state).toMatchObject({
      kind: 'idle',
      roof: 3,
      said: { kind: 'copied', roof: 3, of: { kind: 'roof', number: 1 } },
    });
  });

  it('a copy keeps what the roof is made of and whether it was confirmed', () => {
    const made = {
      ...TERRACE,
      material: { type: 'rcc', setBy: 'person', confirmed: true } as const,
    };
    const { document } = run([{ kind: 'copy_roof', roof: 0, ids: ['copy'] }], designOf(made));
    expect(document.roofs[1]?.material).toEqual(made.material);
    expect(document.roofs[1]?.corners[0]).toEqual(p(10 + COPY_GAP_M, 0));
  });

  it('a copy with too few names for its parts makes nothing', () => {
    expect(run([{ kind: 'copy_roof', roof: 0, ids: ['copy'] }], design).commits).toBe(0);
  });

  it('Delete on a row: that roof goes with what stands on it, and the line names what went', () => {
    const { state, document, commits } = run([{ kind: 'delete_roof', roof: 0 }], design);
    expect(commits).toBe(1);
    expect(document.roofs.map((roof) => roof.id)).toEqual(['shed']);
    expect(saidOf(state)).toEqual({ kind: 'roof_deleted', was: { kind: 'roof', number: 1 } });
  });

  it('Delete on the stair room’s row names it by its kind and its roof', () => {
    const { state, document } = run([{ kind: 'delete_roof', roof: 1 }], design);
    expect(document.roofs.map((roof) => roof.id)).toEqual(['terrace', 'shed']);
    expect(saidOf(state)).toEqual({ kind: 'roof_deleted', was: { kind: 'stair_room', with: 1 } });
  });
});
