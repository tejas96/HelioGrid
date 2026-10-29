import { describe, expect, it, vi } from 'vitest';
import { allReads, mapRead, type Read } from '../../src/shell/read';

const loading: Read<number> = { kind: 'loading' };
const empty: Read<number> = { kind: 'empty' };
const ready = (value: number): Read<number> => ({ kind: 'ready', value });
const failed = (retry = () => {}): Read<number> => ({
  kind: 'failed',
  failure: 'no_answer',
  retry,
});

describe('allReads', () => {
  it.each([
    { name: 'no reads', reads: [], kind: 'ready' },
    { name: 'every read ready', reads: [ready(1), ready(2)], kind: 'ready' },
    { name: 'one empty among ready', reads: [ready(1), empty], kind: 'empty' },
    { name: 'one loading beside an empty', reads: [empty, loading], kind: 'loading' },
    { name: 'one failed beside a loading', reads: [loading, failed(), empty], kind: 'failed' },
  ])('allReads: failed wins, then loading, then empty, then ready — $name', ({ reads, kind }) => {
    expect(allReads(reads).kind).toBe(kind);
  });

  it('allReads: the joined retry asks every failed read again, and no other', () => {
    const first = vi.fn();
    const second = vi.fn();
    const joined = allReads([failed(first), ready(1), failed(second)]);
    if (joined.kind !== 'failed') throw new Error('expected failed');
    joined.retry();
    expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
  });

  it('allReads: ready carries each value in its place', () => {
    expect(allReads([ready(1), ready(2)])).toEqual({ kind: 'ready', value: [1, 2] });
  });
});

describe('mapRead', () => {
  it.each([
    { name: 'ready maps its value', read: ready(2), out: { kind: 'ready', value: 4 } },
    { name: 'loading passes', read: loading, out: { kind: 'loading' } },
    { name: 'empty passes', read: empty, out: { kind: 'empty' } },
  ])('mapRead: $name', ({ read, out }) => {
    expect(mapRead(read, (value) => value * 2)).toEqual(out);
  });
});
