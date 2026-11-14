import { describe, expect, it } from 'vitest';
import type { BuilderSaveState } from '../../src/react/proposal-builder-frame';
import { builderHoldsChange } from '../../src/react/proposal-builder-leave';

/**
 * The builder's way out asks first only while the screen shows what the server does not hold
 * (`T-M06-023`): the web's leave guard and the phone's `usePreventRemove` both read this one rule.
 */
describe('builderHoldsChange', () => {
  it('a draft not read yet holds nothing', () => {
    expect(builderHoldsChange(null, 0)).toBe(false);
  });

  it.each<[string, BuilderSaveState | null, number, boolean]>([
    ['nothing typed yet', null, 0, false],
    ['every value saved', { kind: 'saved' }, 0, false],
    ['a value being saved', { kind: 'saving' }, 0, false],
    ['one value kept unsaved', { kind: 'unsaved', count: 1 }, 0, true],
    ['typed with no connection', { kind: 'offline' }, 0, true],
    ['changed on another device', { kind: 'conflict' }, 0, true],
    ['one value refused, the rest saved', { kind: 'saved' }, 1, true],
    ['one value refused, nothing else said', null, 1, true],
  ])('%s', (_, save, refused, asks) => {
    expect(builderHoldsChange({ save }, refused)).toBe(asks);
  });
});
