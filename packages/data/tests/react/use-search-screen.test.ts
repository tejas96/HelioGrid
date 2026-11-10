// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { refusal } from './origin-wire';
import {
  holdWrites,
  leadRowOf,
  mountedSearch,
  origin,
  PRIYA,
  READ_RETRIES_MS,
  type SearchView,
  SURESH_JUNK,
} from './search-origin';

/**
 * Global Search's reads and its one act, end to end through the real client (`F6-20`, `F6-23`):
 * the typing rests before it asks, an answer is drawn in groups or as nothing found, a failed read
 * offers its retry, and a junk lead's Reopen is out in its row until the server confirms it.
 */
const typeEach = (view: SearchView, keys: readonly string[]) => {
  for (const typed of keys) act(() => view.result.current.type(typed));
};

const readKind = (view: SearchView) => view.result.current.read.kind;

describe('the typing rests before the search asks', () => {
  it('asks once for what was typed, never once per key', async () => {
    const view = mountedSearch();
    expect(readKind(view)).toBe('idle');
    // A first answer: the session is in, so every key from here could ask.
    typeEach(view, ['Priya']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    act(() => view.result.current.clear());
    origin.asked = [];
    typeEach(view, ['9', '98', '982', '9822']);
    expect(readKind(view)).toBe('loading');
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    expect(origin.asked).toEqual(['9822']);
  });

  it('clearing goes back to the hint at once, with nothing asked', async () => {
    const view = mountedSearch();
    typeEach(view, ['Priya']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    act(() => view.result.current.clear());
    expect(view.result.current.query).toBe('');
    expect(readKind(view)).toBe('idle');
    expect(origin.asked).toEqual(['Priya']);
  });

  it('an answer stays while the same number is typed on, never under an unrelated query', async () => {
    const view = mountedSearch();
    typeEach(view, ['98220']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    typeEach(view, ['982201']);
    expect(readKind(view)).toBe('ready');
    expect(view.result.current.searching).toBe(true);
    typeEach(view, ['Sangli']);
    expect(readKind(view)).toBe('loading');
  });
});

describe('what the answer draws', () => {
  it('a number finds its leads, the typed digits marked across the space', async () => {
    const view = mountedSearch();
    typeEach(view, ['98220 1']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    const priya = leadRowOf(view, PRIYA.id);
    expect(priya.number).toEqual({ shown: '+91 98220 14567', typed: [4, 11] });
    expect(priya.address).toBe(`leads/${PRIYA.id}`);
  });

  it('nothing found names the query it was asked', async () => {
    const view = mountedSearch();
    typeEach(view, ['98765 00000']);
    await waitFor(() => expect(readKind(view)).toBe('empty'));
    expect(view.result.current.read).toEqual({ kind: 'empty', asked: '98765 00000' });
  });

  it(
    'a failed read says so, and its retry asks again',
    async () => {
      const view = mountedSearch();
      origin.failSearch = true;
      typeEach(view, ['Priya']);
      await waitFor(() => expect(readKind(view)).toBe('failed'), { timeout: READ_RETRIES_MS });
      origin.failSearch = false;
      const { read } = view.result.current;
      act(() => (read.kind === 'failed' ? read.retry() : undefined));
      await waitFor(() => expect(readKind(view)).toBe('ready'));
    },
    READ_RETRIES_MS + 5_000,
  );
});

describe('the keyboard’s cursor', () => {
  it('starts on the first row, stops at either end, and starts over on a new answer', async () => {
    const view = mountedSearch();
    typeEach(view, ['98220']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    const cursor = () => view.result.current.cursor;
    expect(cursor()).toBe(`lead:${PRIYA.id}`);
    expect(view.result.current.cursorAddress).toBe(`leads/${PRIYA.id}`);
    act(() => view.result.current.step(-1));
    expect(cursor()).toBe(`lead:${PRIYA.id}`);
    act(() => view.result.current.step(1));
    act(() => view.result.current.step(1));
    expect(cursor()).toBe(`lead:${SURESH_JUNK.id}`);
    typeEach(view, ['Sangli']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    expect(cursor()).toBe(`lead:${SURESH_JUNK.id}`);
    typeEach(view, ['Priya']);
    await waitFor(() => expect(cursor()).toBe(`lead:${PRIYA.id}`));
  });
});

describe('a junk lead is found with its mark, and Reopen is out in its row (F6-23)', () => {
  it('waits in the row, sends once, then draws the lead open with no Reopen', async () => {
    const view = mountedSearch();
    typeEach(view, ['98220 36941']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    expect(leadRowOf(view, SURESH_JUNK.id)).toMatchObject({
      state: 'junk',
      exact: true,
      reopen: { kind: 'offered' },
    });

    const release = holdWrites();
    act(() => view.result.current.reopen(SURESH_JUNK.id));
    act(() => view.result.current.reopen(SURESH_JUNK.id));
    await waitFor(() => expect(origin.writes).toHaveLength(1));
    expect(leadRowOf(view, SURESH_JUNK.id).reopen).toEqual({ kind: 'waiting' });
    expect(origin.writes[0]?.path).toBe(`/leads/${SURESH_JUNK.id}/reopen`);

    release();
    await waitFor(() => expect(leadRowOf(view, SURESH_JUNK.id).reopen).toBeNull());
    expect(leadRowOf(view, SURESH_JUNK.id).state).toBeNull();
    expect(origin.writes).toHaveLength(1);
  });

  it.each([
    [
      'refused by the lead’s standing',
      { status: 422, body: refusalWith('not_reopenable') },
      'refused',
    ],
    ['a server failure', { status: 500, body: refusal('INTERNAL') }, 'failed'],
  ] as const)('%s comes back in the row, the lead still junk', async (_case, answer, kind) => {
    const view = mountedSearch();
    origin.reopens = [answer];
    typeEach(view, ['Suresh']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    act(() => view.result.current.reopen(SURESH_JUNK.id));
    await waitFor(() =>
      expect(leadRowOf(view, SURESH_JUNK.id).reopen).toMatchObject({
        kind: 'returned',
        failure: { kind },
      }),
    );
    expect(leadRowOf(view, SURESH_JUNK.id).state).toBe('junk');
  });

  it('the billing gate’s refusal leaves the row as it was: the app’s denial tells it once', async () => {
    const view = mountedSearch();
    origin.reopens = [
      {
        status: 403,
        body: {
          error: {
            code: 'ENTITLEMENT_BLOCKED',
            message: 'This is paused for your company.',
            requestId: 'test',
            blocked: {
              reason: 'billing_state',
              capability: 'create_edit_records',
              phase: 'halted',
              haltsAt: null,
            },
          },
        },
      },
    ];
    typeEach(view, ['Suresh']);
    await waitFor(() => expect(readKind(view)).toBe('ready'));
    act(() => view.result.current.reopen(SURESH_JUNK.id));
    await waitFor(() => expect(origin.writes).toHaveLength(1));
    await waitFor(() =>
      expect(leadRowOf(view, SURESH_JUNK.id).reopen).toEqual({ kind: 'offered' }),
    );
  });
});

/** The api's refusal of a move the lead's standing does not allow, with domain's reason. */
function refusalWith(reason: string) {
  return {
    error: {
      code: 'LEAD_TRANSITION_REFUSED',
      message: reason,
      requestId: 'test',
      facts: { refusal: reason },
    },
  };
}
