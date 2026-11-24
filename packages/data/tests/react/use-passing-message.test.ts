// @vitest-environment happy-dom

import { MESSAGE_DWELL_MS, type MessageTone } from '@heliogrid/domain';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type PassingMessage, usePassingMessage } from '../../src/react/use-passing-message';

/**
 * The studio's one bottom bar (`T-M05-002`): of the messages there, the worst not closed shows;
 * information that asks nothing goes by itself; × closes only the one in view; the same words said
 * again after they went show again.
 */
const say = (key: string, tone: MessageTone, asks = false, stays = false): PassingMessage => ({
  key,
  tone,
  asks,
  stays,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function shownOver(first: readonly PassingMessage[]) {
  return renderHook(({ messages }) => usePassingMessage(messages), {
    initialProps: { messages: first },
  });
}

describe('usePassingMessage', () => {
  it('shows the worst message, and nothing with nothing to say', () => {
    const view = shownOver([say('moved', 'info'), say('cross', 'error')]);
    expect(view.result.current.shown?.key).toBe('cross');
    view.rerender({ messages: [] });
    expect(view.result.current.shown).toBeNull();
  });

  it('lets information that asks nothing go by itself, and keeps one that asks', () => {
    const view = shownOver([say('moved', 'info')]);
    act(() => vi.advanceTimersByTime(MESSAGE_DWELL_MS));
    expect(view.result.current.shown).toBeNull();
    view.rerender({ messages: [say('no-picture', 'info', true)] });
    act(() => vi.advanceTimersByTime(MESSAGE_DWELL_MS * 2));
    expect(view.result.current.shown?.key).toBe('no-picture');
  });

  it('keeps a warning and an error until closed', () => {
    const view = shownOver([say('cross', 'error')]);
    act(() => vi.advanceTimersByTime(MESSAGE_DWELL_MS * 2));
    expect(view.result.current.shown?.key).toBe('cross');
  });

  it('closes only the message in view: the next worst shows', () => {
    const view = shownOver([say('saved-first', 'warning', true), say('cross', 'error')]);
    act(() => view.result.current.close());
    expect(view.result.current.shown?.key).toBe('saved-first');
  });

  it('shows the same words again once they went and are said anew', () => {
    const view = shownOver([say('why', 'info')]);
    act(() => view.result.current.close());
    expect(view.result.current.shown).toBeNull();
    view.rerender({ messages: [] });
    view.rerender({ messages: [say('why', 'info')] });
    expect(view.result.current.shown?.key).toBe('why');
  });

  it('keeps a message closed while a job narrows what shows, as long as it is still said', () => {
    const view = renderHook(
      ({ job }) =>
        usePassingMessage(
          [say('no-picture', 'warning', true), say('saved-first', 'warning')],
          (m) => (job ? m.key === 'saved-first' : true),
        ),
      { initialProps: { job: false } },
    );
    expect(view.result.current.shown?.key).toBe('no-picture');
    act(() => view.result.current.close());
    view.rerender({ job: true });
    expect(view.result.current.shown?.key).toBe('saved-first');
    act(() => view.result.current.close());
    view.rerender({ job: false });
    expect(view.result.current.shown).toBeNull();
  });
});
