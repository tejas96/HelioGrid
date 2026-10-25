import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type {
  CatalogImportRowWire,
  CatalogImportWire,
  SessionProjection,
} from '@heliogrid/contracts';
import { ROLE_PRESETS } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { refusal, send, writeBodyOf } from './origin-wire';

export { refusal } from './origin-wire';

/**
 * The import wizard's hooks end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): an origin that answers the import routes in the contract's shapes, each write the way a
 * case needs, counting every read of the job.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
const TENANT = '01a30000-0000-7000-8000-000000000001';
const USER = '01a30000-0000-7000-8000-000000000002';
export const JOB_ID = '01a30000-0000-7000-8000-000000000301';

export const A_JOB: CatalogImportWire = {
  id: JOB_ID,
  status: 'previewed',
  entryPoint: 'settings',
  fileName: 'Price list Aug 2026.xlsx',
  savedAt: null,
  startedBy: USER,
  createdAt: '2026-10-25T10:00:00.000Z',
  unreadableReason: null,
  file: { id: '01a30000-0000-7000-8000-000000000401', contentType: 'text/csv', byteSize: 120 },
  sheets: [
    { name: 'Price list', rowCount: 4, columnCount: 3, topRows: [['Brand', 'Model', 'Rate']] },
  ],
  mapping: { sheet: 0, headerRow: 0, columns: ['brand', 'model', 'rate'] },
  counts: { rows: 3, matched: 1, newItems: 1, needsAttention: 1, leftOut: 0 },
  run: null,
  results: null,
};

/** A row as the preview pages it. */
export const A_ROW: CatalogImportRowWire = {
  rowNumber: 4,
  cells: { brand: 'Polycab', model: 'DC-6', rate: '' },
  fix: {},
  leftOut: false,
  answer: null,
  outcome: 'needs_attention',
  attention: [{ reason: 'price_missing', fields: [] }],
  match: null,
  named: [],
  repeats: null,
  filePrice: null,
  catalogPrice: null,
  result: null,
  failure: null,
  priceBefore: null,
  priceApplied: null,
};

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown };

interface Origin {
  job: CatalogImportWire;
  /** The next answers to any import write, in order; an exhausted list answers success. */
  writes: Answer[];
  /** Every write's method and act, in order. */
  sent: string[];
  /** How many times the job was read. */
  reads: number;
}

export const origin: Origin = { job: structuredClone(A_JOB), writes: [], sent: [], reads: 0 };
let server: Server;
let baseUrl = '';

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

async function answerWrite(req: IncomingMessage, res: ServerResponse, act: string) {
  origin.sent.push(`${req.method} ${act}`);
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const answer = origin.writes.shift() ?? { status: 200 };
  if (answer.status === 200 && act === 'run') origin.job = { ...origin.job, status: 'running' };
  const fixedRow = {
    ...A_ROW,
    rowNumber: Number(req.url?.split('/').pop()),
    outcome: 'price_override',
  };
  const fixed = { rows: [fixedRow], counts: origin.job.counts };
  send(res, req, answer.status, answer.body ?? (act === 'fix' ? fixed : origin.job));
}

function answer(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === `/catalog/imports/${JOB_ID}` && req.method === 'GET') {
    origin.reads += 1;
    return send(res, req, 200, origin.job);
  }
  if (url.pathname === `/catalog/imports/${JOB_ID}/run`) return void answerWrite(req, res, 'run');
  if (/^\/catalog\/imports\/[^/]+\/rows\/\d+$/.test(url.pathname)) {
    return void answerWrite(req, res, 'fix');
  }
  if (/^\/catalog\/imports\/[^/]+\/rows$/.test(url.pathname)) {
    return send(res, req, 200, { items: [], totalCount: 0 });
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
  Object.assign(origin, { job: structuredClone(A_JOB), writes: [], sent: [], reads: 0 });
});

/** A hook mounted in the real provider over the origin. */
export function mountedOver<T>(hook: () => T) {
  const layer = createDataLayer({ baseUrl, language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper });
}
