// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAction } from '../../src/react/action';

/** A send held open until the test lets it answer, so two runs truly overlap. */
function heldSends() {
  const sent: string[] = [];
  const answers: Array<() => void> = [];
  const send = (row: string) =>
    new Promise<string>((resolve) => {
      sent.push(row);
      answers.push(() => resolve(row));
    });
  return {
    sent,
    send,
    answerAll: () => {
      for (const answer of answers.splice(0)) answer();
    },
  };
}

describe('useAction', () => {
  it('useAction: a second run while one is out sends nothing', async () => {
    const held = heldSends();
    const view = renderHook(() => useAction(held.send));
    let first: Promise<unknown> = Promise.resolve();
    let second: unknown = null;
    await act(async () => {
      first = view.result.current.run('a');
      second = await view.result.current.run('a');
    });
    expect(view.result.current.isOut()).toBe(true);
    expect({ sent: held.sent, second, pending: view.result.current.pending }).toEqual({
      sent: ['a'],
      second: { kind: 'out' },
      pending: true,
    });
    await act(async () => {
      held.answerAll();
      await first;
    });
    expect([view.result.current.pending, view.result.current.isOut()]).toEqual([false, false]);
    await act(async () => {
      void view.result.current.run('a');
    });
    expect(held.sent).toEqual(['a', 'a']);
    await act(async () => held.answerAll());
  });

  it('useAction: a keyed run locks only its own row', async () => {
    const held = heldSends();
    const view = renderHook(() => useAction(held.send, { key: (row) => row }));
    await act(async () => {
      void view.result.current.run('a');
      void view.result.current.run('a');
      void view.result.current.run('b');
    });
    expect(held.sent).toEqual(['a', 'b']);
    expect([view.result.current.isOut('a'), view.result.current.isOut('c')]).toEqual([true, false]);
    expect([view.result.current.pendingFor('a'), view.result.current.pendingFor('c')]).toEqual([
      true,
      false,
    ]);
    await act(async () => held.answerAll());
  });

  it('useAction: a done send answers its output', async () => {
    const view = renderHook(() => useAction((row: string) => Promise.resolve(row.length)));
    let answer: unknown = null;
    await act(async () => {
      answer = await view.result.current.run('abc');
    });
    expect(answer).toEqual({ kind: 'done', output: 3 });
  });

  it('useAction: a failed send keeps its failure until the next run', async () => {
    const view = renderHook(() => useAction((_: string) => Promise.reject(new Error('refused'))));
    let answer: unknown = null;
    await act(async () => {
      answer = await view.result.current.run('a');
    });
    expect(answer).toMatchObject({ kind: 'failed' });
    expect((view.result.current.failure as Error).message).toBe('refused');
    act(() => view.result.current.clear());
    expect(view.result.current.failure).toBeNull();
  });
});
