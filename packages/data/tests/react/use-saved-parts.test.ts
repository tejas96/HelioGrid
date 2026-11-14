// @vitest-environment happy-dom
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { SavedPart } from '@heliogrid/contracts';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { refusedPartFields, useSavedParts } from '../../src/react/use-saved-parts';
import { answeredCompanyFacts } from './branding-origin';
import { listeningOrigin, refusal, send } from './origin-wire';

/**
 * A picker's saved parts (`M06-28`, `T-M06-034`) through the real client: the first page is read,
 * *Show more* stands while the company holds parts beyond it and reads the next page on, and goes
 * once every part is in.
 */

const part = (n: number): SavedPart => ({
  id: `01a30000-0000-7000-8000-${String(n).padStart(12, '0')}`,
  kind: 'cable',
  brand: `Brand ${n}`,
  specification: '4 sq mm',
  warranty: null,
  description: null,
  archived: false,
});

const held = { parts: [] as SavedPart[], asks: [] as URLSearchParams[] };

function answer(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (answeredCompanyFacts(req, res)) return;
  if (url.pathname !== '/saved-parts') return send(res, req, 404, refusal('NOT_FOUND'));
  held.asks.push(url.searchParams);
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const items = held.parts.slice((page - 1) * limit, page * limit);
  send(res, req, 200, { items, totalCount: held.parts.length });
}

const listening = listeningOrigin(answer);

afterEach(() => {
  cleanup();
  Object.assign(held, { parts: [], asks: [] });
});

function mounted() {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(() => useSavedParts('cable'), { wrapper });
}

const shown = (view: ReturnType<typeof mounted>) => {
  const { read } = view.result.current;
  return read.kind === 'ready' ? read.value.length : 0;
};

describe('useSavedParts — Show more reads on while parts stand beyond the page', () => {
  it.each([
    ['none saved', 0, 'empty', false],
    ['fewer than a page', 3, 'ready', false],
    ['exactly a page', 50, 'ready', false],
    ['one past a page', 51, 'ready', true],
  ] as const)('%s: the first page, and Show more only past it', async (_, count, kind, more) => {
    held.parts = Array.from({ length: count }, (__, n) => part(n + 1));
    const view = mounted();
    await waitFor(() => expect(view.result.current.read.kind).toBe(kind));
    expect(view.result.current.hasMore).toBe(more);
    expect(held.asks[0]?.get('kind')).toBe('cable');
    expect(held.asks[0]?.get('archived')).toBeNull();
  });

  it('Show more reads the next page on, keeps the first, and goes once every part is in', async () => {
    held.parts = Array.from({ length: 60 }, (_, n) => part(n + 1));
    const view = mounted();
    await waitFor(() => expect(shown(view)).toBe(50));
    expect(view.result.current.hasMore).toBe(true);

    act(() => view.result.current.loadMore());

    await waitFor(() => expect(shown(view)).toBe(60));
    expect(view.result.current.hasMore).toBe(false);
    expect(held.asks.map((ask) => ask.get('page'))).toEqual(['1', '2']);
    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.at(-1)?.brand).toBe('Brand 60');
  });
});

describe('refusedPartFields — a refusal that names a field is said at that field', () => {
  const failed = (paths: readonly string[], code = 'VALIDATION_FAILED') => ({
    kind: 'failed' as const,
    failure: null,
    code,
    message: 'The server’s sentence.',
    details: paths.map((path) => ({ path, issue: 'too_small' })),
  });
  it.each([
    ['an empty specification', failed(['specification']), ['specification']],
    ['brand and specification', failed(['brand', 'specification']), ['brand', 'specification']],
    ['a path no field holds', failed(['kind']), []],
    ['no path at all', failed([]), []],
    ['no connection', { ...failed([]), failure: 'no_connection' as const }, []],
    ['a duplicate', { kind: 'duplicate' as const, partId: 'p' }, []],
    ['nothing failed', null, []],
  ])('%s', (_, failure, fields) => {
    expect(refusedPartFields(failure)).toEqual(fields);
  });
});
