import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { apiContract } from '@heliogrid/contracts';
import { afterAll, beforeAll } from 'vitest';

/**
 * The wire every test origin speaks (`packages/data/CLAUDE.md`, Done means). A write body is read
 * through `writeBodyOf`, which refuses what the route's own contract schema refuses, as the api
 * does — an origin that took any body would pass a hook that sends the wrong shape.
 */
export const refusal = (code: string) => ({ error: { code, message: code, requestId: 'test' } });

export function send(res: ServerResponse, req: IncomingMessage, status: number, body?: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': req.headers.origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
    'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

interface BodySchema {
  safeParse(body: unknown): { success: boolean };
}
interface Route {
  readonly method: string;
  readonly pattern: RegExp;
  readonly body: BodySchema | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isSchema = (value: unknown): value is BodySchema =>
  isRecord(value) && typeof value.safeParse === 'function';

function routesOf(router: unknown): Route[] {
  if (!isRecord(router)) return [];
  if (typeof router.method === 'string' && typeof router.path === 'string') {
    const pattern = new RegExp(`^${router.path.replace(/:[^/]+/g, '[^/]+')}$`);
    return [
      { method: router.method, pattern, body: isSchema(router.body) ? router.body : undefined },
    ];
  }
  return Object.values(router).flatMap(routesOf);
}

const ROUTES = routesOf(apiContract);

/** A body the route's contract refuses; a route with no body schema refuses nothing. */
function refusedByContract(method: string, path: string, body: unknown): boolean {
  const route = ROUTES.find((r) => r.method === method && r.pattern.test(path));
  return route?.body !== undefined && !route.body.safeParse(body).success;
}

/** The write's body, or `null` once the origin has answered the api's 400 for a refused one. */
export async function writeBodyOf(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<{ body: unknown } | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString();
  const body: unknown = text === '' ? undefined : JSON.parse(text);
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (refusedByContract(req.method ?? 'GET', path, body)) {
    send(res, req, 400, refusal('VALIDATION_FAILED'));
    return null;
  }
  return { body };
}

/**
 * An origin listening on a free local port for the tests of the file that calls this: started
 * before them, closed after. Answers `url()` once it listens.
 */
export function listeningOrigin(answer: (req: IncomingMessage, res: ServerResponse) => void) {
  const server = createServer(answer);
  let url = '';
  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
  return { url: () => url };
}
