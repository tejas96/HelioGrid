import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  type CatalogItemWire,
  catalogOverrideWriteSchema,
  type PriceBookActiveWire,
  type PriceBookPublish,
  priceBookPublishSchema,
  type SessionProjection,
} from '@heliogrid/contracts';
import { ROLE_PRESETS } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';

/**
 * Catalog settings' hooks end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): an origin that answers the catalog and price-book routes in the contract's shapes, each
 * write the way a case needs.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
const TENANT = '01a20000-0000-7000-8000-000000000001';
const USER = '01a20000-0000-7000-8000-000000000002';

export const OWN_SKU: CatalogItemWire = {
  id: '01a20000-0000-7000-8000-000000000101',
  source: 'own_item',
  brand: 'Own Panels',
  model: 'OP-550',
  spec: {
    kind: 'panel',
    watt: 550,
    technology: 'topcon',
    lengthMm: 2278,
    widthMm: 1134,
    vocV: 49.6,
    vmpV: 41.8,
    iscA: 14,
    impA: 13.2,
    tempCoeffVocPct: -0.25,
    warrantyYears: 30,
    weightKg: 27,
  },
  provenance: 'tenant_provided',
  availability: null,
  certifications: [],
  badges: [],
  tax: null,
  rate: { source: 'own_item', amount: '12500', currencyCode: 'INR', effectiveOn: '2026-10-24' },
  hidden: false,
  preferred: false,
  archived: false,
  openDraftCount: 0,
};

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  item: CatalogItemWire;
  /** The next answers to any catalog write, in order; an exhausted list answers success. */
  writes: Answer[];
  /** Every write's method and path, in order. */
  sent: string[];
  /** Every write's body, in order. */
  bodies: unknown[];
  book: PriceBookActiveWire;
}

const EMPTY_BOOK: PriceBookActiveWire = {
  version: null,
  defaultMarginPct: '15.00',
  currencyCode: 'INR',
  rates: [],
};

export const origin: Origin = {
  item: structuredClone(OWN_SKU),
  writes: [],
  sent: [],
  bodies: [],
  book: structuredClone(EMPTY_BOOK),
};
let server: Server;
let baseUrl = '';

export const refusal = (code: string) => ({ error: { code, message: code, requestId: 'test' } });

function send(res: ServerResponse, req: IncomingMessage, status: number, body?: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': req.headers.origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
    'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function projection(): SessionProjection {
  return {
    actor: {
      userId: USER,
      phoneE164: '+919999999901',
      displayName: 'Rajesh Sharma',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: [OWNER_ROLE], authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

async function bodyOf(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString();
  return text === '' ? undefined : JSON.parse(text);
}

/** The contract's own body check, as the api runs it: a body it refuses is the api's 400. */
const BODY_OF: Record<string, { safeParse(body: unknown): { success: boolean } }> = {
  override: catalogOverrideWriteSchema,
};

/** A catalog write: the next queued answer, else the act applied to the one item. */
async function answerWrite(req: IncomingMessage, res: ServerResponse, act: string) {
  origin.sent.push(`${req.method} ${act}`);
  const body = await bodyOf(req);
  origin.bodies.push(body);
  if (req.method === 'PUT' && BODY_OF[act]?.safeParse(body).success === false) {
    return send(res, req, 400, refusal('VALIDATION_FAILED'));
  }
  const answer = origin.writes.shift() ?? { status: act === 'rate-entries' ? 201 : 200 };
  if (answer === 'drop') return void req.socket.destroy();
  if (answer.status < 300) {
    if (act === 'archive') origin.item.archived = true;
    if (act === 'unarchive') origin.item.archived = false;
  }
  send(res, req, answer.status, answer.body ?? origin.item);
}

async function answerPublish(req: IncomingMessage, res: ServerResponse) {
  const sent = await bodyOf(req);
  origin.bodies.push(sent);
  if (!priceBookPublishSchema.safeParse(sent).success) {
    return send(res, req, 400, refusal('VALIDATION_FAILED'));
  }
  const body = sent as PriceBookPublish;
  const number = (origin.book.version?.number ?? 0) + 1;
  const version = {
    id: `01a20000-0000-7000-8000-00000000020${number}`,
    number,
    publishedAt: '2026-10-24T10:00:00.000Z',
    publishedBy: { id: USER, name: 'Rajesh Sharma' },
    note: body.note,
  };
  origin.book = { ...origin.book, version, rates: body.rates };
  send(res, req, 201, version);
}

function answer(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === '/price-book/active') return send(res, req, 200, origin.book);
  if (url.pathname === '/price-book/versions' && req.method === 'POST') {
    return void answerPublish(req, res);
  }
  const write = /^\/catalog\/items\/[^/]+\/(archive|unarchive|override|rate-entries)$/.exec(
    url.pathname,
  );
  if (write && req.method !== 'GET') return void answerWrite(req, res, write[1] ?? '');
  if (/^\/catalog\/items\/[^/]+$/.test(url.pathname)) {
    if (req.method === 'GET') return send(res, req, 200, origin.item);
    return void answerWrite(req, res, 'item');
  }
  send(res, req, 404, refusal('NOT_FOUND'));
}

beforeAll(async () => {
  server = createServer(answer);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

afterEach(() => {
  cleanup();
  Object.assign(origin, {
    item: structuredClone(OWN_SKU),
    writes: [],
    sent: [],
    bodies: [],
    book: structuredClone(EMPTY_BOOK),
  });
});

/** A hook mounted in the real provider over the origin. */
export function mountedOver<T>(hook: () => T) {
  const layer = createDataLayer({ baseUrl, language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper });
}
