// @vitest-environment happy-dom
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { useQuery } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { useRepositories } from '../../src/react/context';
import { DataProvider } from '../../src/react/provider';
import { readOf } from '../../src/react/read';
import { refusal, send } from './origin-wire';

type Answer = 'live' | 'refuse' | 'drop' | 'hold';
const origin: { answer: Answer; asked: number } = { answer: 'live', asked: 0 };
let server: Server;
let baseUrl = '';

function answer(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.asked += 1;
  if (origin.answer === 'hold') return;
  if (origin.answer === 'drop') return void res.destroy();
  if (origin.answer === 'refuse') return send(res, req, 404, refusal('NOT_FOUND'));
  send(res, req, 200, { status: 'ok', service: 'api', version: '1.0.0' });
}

beforeAll(async () => {
  server = createServer(answer);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => {
  server.closeAllConnections();
  return new Promise<void>((resolve) => server.close(() => resolve()));
});
afterEach(() => {
  cleanup();
  Object.assign(origin, { answer: 'live', asked: 0 });
});

/** The liveness read as a `Read`, with `isEmpty` when given. */
function mountedRead(isEmpty?: (version: string) => boolean) {
  const layer = createDataLayer({ baseUrl, language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(
    () => {
      const { health } = useRepositories();
      const query = useQuery({
        queryKey: ['read-test'],
        queryFn: async ({ signal }) => (await health.liveness(signal)).version,
      });
      return { read: readOf(query, isEmpty), reRead: query.refetch };
    },
    { wrapper },
  );
}

describe('readOf, through the real client', () => {
  it.each([
    { answer: 'hold', isEmpty: undefined, read: { kind: 'loading' } },
    { answer: 'live', isEmpty: undefined, read: { kind: 'ready', value: '1.0.0' } },
    { answer: 'live', isEmpty: (): boolean => true, read: { kind: 'empty' } },
    { answer: 'live', isEmpty: (): boolean => false, read: { kind: 'ready', value: '1.0.0' } },
    { answer: 'refuse', isEmpty: undefined, read: { kind: 'failed', failure: 'refused' } },
    { answer: 'drop', isEmpty: undefined, read: { kind: 'failed', failure: 'no_connection' } },
  ] as const)(
    'readOf: loading, empty, failed with its failure, ready — through the real client ($answer)',
    async ({ answer, isEmpty, read }) => {
      origin.answer = answer;
      const view = mountedRead(isEmpty);
      await waitFor(() => expect(view.result.current.read).toMatchObject(read), { timeout: 8000 });
    },
    10_000,
  );

  it('readOf: the failed read asks again on retry, and lands ready', async () => {
    origin.answer = 'refuse';
    const view = mountedRead();
    await waitFor(() => expect(view.result.current.read.kind).toBe('failed'));
    origin.answer = 'live';
    const failed = view.result.current.read;
    if (failed.kind === 'failed') failed.retry();
    await waitFor(() =>
      expect(view.result.current.read).toEqual({ kind: 'ready', value: '1.0.0' }),
    );
  });

  it('readOf: a value stays ready when a re-read fails', async () => {
    const view = mountedRead();
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    origin.answer = 'refuse';
    const reRead = await view.result.current.reRead();
    expect(reRead.isError).toBe(true);
    expect(view.result.current.read).toEqual({ kind: 'ready', value: '1.0.0' });
  });
});
