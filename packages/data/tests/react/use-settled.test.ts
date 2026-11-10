// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettled } from '../../src/react/use-settled';

const WAIT_MS = 300;

/** Starts settled on `asked`, then types `typed` over it. */
function typedOver(asked: string | null, typed: string | null) {
  const view = renderHook(({ value }) => useSettled(value, WAIT_MS), {
    initialProps: { value: asked },
  });
  view.rerender({ value: typed });
  return view;
}

describe('useSettled', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ['nothing', ''],
    ['only spaces', '   '],
    ['no checkable number', null],
  ])('a value that asks %s settles in the same render', (_, typed) => {
    const view = typedOver('rajesh', typed);
    expect(view.result.current).toBe(typed);
  });

  it.each([
    ['one ms short of the wait', WAIT_MS - 1, 'rajesh'],
    ['at the wait', WAIT_MS, 'raj'],
  ])('a value that asks something settles only after the rest — %s', (_, rested, settled) => {
    const view = typedOver('rajesh', 'raj');
    act(() => {
      vi.advanceTimersByTime(rested);
    });
    expect(view.result.current).toBe(settled);
  });

  it('a key before the rest ends starts the wait again', () => {
    const view = typedOver('', 'ra');
    act(() => {
      vi.advanceTimersByTime(WAIT_MS - 1);
    });
    view.rerender({ value: 'raj' });
    act(() => {
      vi.advanceTimersByTime(WAIT_MS - 1);
    });
    expect(view.result.current).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(view.result.current).toBe('raj');
  });

  it('a word typed after a clear waits from blank, never showing the word before the clear', () => {
    const view = typedOver('rajesh', '');
    view.rerender({ value: 'priya' });
    expect(view.result.current).toBe('');
  });
});
