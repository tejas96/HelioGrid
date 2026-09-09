import { describe, expect, it } from 'vitest';
import { inMatrixOrder, ROLE_PRESETS } from '../../src/authz/roles';

const [FIRST, SECOND, THIRD] = ROLE_PRESETS;

describe('inMatrixOrder — one set, one order, one row per preset (F2-25)', () => {
  it.each([
    { typed: [], held: [] },
    { typed: [THIRD, FIRST], held: [FIRST, THIRD] },
    { typed: [SECOND, SECOND, FIRST], held: [FIRST, SECOND] },
    { typed: [...ROLE_PRESETS].reverse(), held: [...ROLE_PRESETS] },
  ])('reads $typed as $held', ({ typed, held }) => {
    expect(inMatrixOrder(typed)).toEqual(held);
  });
});
