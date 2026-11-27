// @vitest-environment happy-dom

import { SAVED_MARK_MS } from '@heliogrid/domain';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudioSaveState } from '../../src/react/studio-save-queue';
import { useSavedFlash } from '../../src/react/use-saved-flash';

type Kind = StudioSaveState['kind'];

/** The save mark's Saved check shows a moment after a save lands, then steps away. */
describe('the Saved check flashes, then hides', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const mounted = (kind: Kind) =>
    renderHook(({ at }: { at: Kind }) => useSavedFlash(at), { initialProps: { at: kind } });
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it('opening on a saved design shows no check', () => {
    expect(mounted('saved').result.current).toBe(false);
  });

  it.each([
    ['a save lands', 'saving'],
    ['the connection comes back and the change goes', 'offline'],
    ['a retry saves', 'failed'],
  ] as const)('%s: the check shows, and hides after its moment', (_, from) => {
    const view = mounted('saved');
    view.rerender({ at: from });
    view.rerender({ at: 'saved' });
    expect(view.result.current).toBe(true);
    wait(SAVED_MARK_MS - 1);
    expect(view.result.current).toBe(true);
    wait(1);
    expect(view.result.current).toBe(false);
  });

  it('changes one after another keep the check on, with no blink', () => {
    const view = mounted('saved');
    view.rerender({ at: 'saving' });
    view.rerender({ at: 'saved' });
    wait(SAVED_MARK_MS - 100);
    view.rerender({ at: 'saving' });
    view.rerender({ at: 'saved' });
    wait(SAVED_MARK_MS - 100);
    expect(view.result.current).toBe(true);
    wait(100);
    expect(view.result.current).toBe(false);
  });
});
