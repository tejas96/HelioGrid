import type { LeadListRow, SessionProjection } from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useLeadsListScreen } from '../../src/react/use-leads-list-screen';
import { listeningOrigin, refusal, send } from './origin-wire';

/**
 * The Leads list end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that keeps a company's leads and answers `GET /leads` the way the api filters, orders and
 * pages them, with the pipeline counted under the owner filter alone, and the inbox's count.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
const TENANT = '01a50000-0000-7000-8000-000000000001';
export const READER = '01a50000-0000-7000-8000-000000000002';
export const RAJESH = '01a50000-0000-7000-8000-000000000003';
/** Longer than the client's retries of a read that gets no readable answer. */
export const READ_RETRIES_MS = 10_000;
const HOUR = 3_600_000;
const NOW = Date.now();

export function aRow(n: number, facts: Partial<LeadListRow> = {}): LeadListRow {
  const at = new Date(NOW - n * HOUR).toISOString();
  return {
    id: `01a50000-0000-7000-8000-0000000001${String(n).padStart(2, '0')}`,
    customerId: `01a50000-0000-7000-8000-0000000002${String(n).padStart(2, '0')}`,
    name: `Lead ${n}`,
    phoneE164: `+9198220413${String(n).padStart(2, '0')}`,
    city: 'Pune',
    segment: 'residential',
    source: 'quick_add',
    stage: 'new',
    state: null,
    owner: { userId: READER, name: 'Asha Patil' },
    monthlyBill: { amount: `${1000 + n * 100}.00`, tier: 'assumed' },
    value: null,
    createdAt: at,
    lastActivityAt: at,
    wakeOn: null,
    unansweredCalls: 0,
    nextTask: null,
    ...facts,
  };
}

interface Origin {
  leads: LeadListRow[];
  inboxWaiting: number;
  failList: boolean;
  /** While set, every `GET /leads` waits for it — the read is out until the test lets it go. */
  gate: Promise<void> | null;
  /** Every `GET /leads` query, in the order asked. */
  asks: URLSearchParams[];
}

export const origin: Origin = {
  leads: [],
  inboxWaiting: 0,
  failList: false,
  gate: null,
  asks: [],
};

/** Holds every list read until `release` is called. */
export function holdReads(): () => void {
  let release = () => {};
  origin.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return () => {
    origin.gate = null;
    release();
  };
}

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER,
      phoneE164: '+919900000002',
      displayName: 'Asha Patil',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: [OWNER_ROLE] as [RolePreset], authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

const isOpen = (row: LeadListRow) => row.state === null || row.state === 'snoozed';

/** The list as the api answers it: filtered, ordered by its key then id, paged, and counted. */
function leadsPage(url: URL) {
  const asked = url.searchParams;
  const ownerId = asked.get('ownerId');
  const owned = origin.leads.filter((row) => ownerId === null || row.owner?.userId === ownerId);
  const state = asked.get('state');
  const q = asked.get('q')?.toLowerCase() ?? null;
  const matching = owned.filter(
    (row) =>
      (state === null ? isOpen(row) : row.state === state) &&
      (asked.get('stage') === null || row.stage === asked.get('stage')) &&
      (asked.get('source') === null || row.source === asked.get('source')) &&
      (q === null || (row.name ?? '').toLowerCase().startsWith(q)),
  );
  const desc = asked.get('order') !== 'asc';
  const keyOf = (row: LeadListRow) =>
    asked.get('sort') === 'monthly_bill'
      ? Number(row.monthlyBill?.amount ?? Number.NaN)
      : Date.parse(row.createdAt);
  const ordered = [...matching].sort((a, b) => (desc ? keyOf(b) - keyOf(a) : keyOf(a) - keyOf(b)));
  const limit = Number(asked.get('limit') ?? '20');
  const page = Number(asked.get('page') ?? '1');
  const stages = new Map<string, number>();
  for (const row of owned.filter(isOpen)) stages.set(row.stage, (stages.get(row.stage) ?? 0) + 1);
  return {
    items: ordered.slice((page - 1) * limit, page * limit),
    totalCount: ordered.length,
    currencyCode: 'INR',
    pipeline: {
      byStage: [...stages].map(([stage, count]) => ({ stage, count })),
      dormant: owned.filter((row) => row.state === 'dormant').length,
    },
  };
}

const server = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === '/leads') {
    origin.asks.push(url.searchParams);
    if (origin.failList) return send(res, req, 500, refusal('INTERNAL'));
    if (origin.gate === null) return send(res, req, 200, leadsPage(url));
    return void origin.gate.then(() => send(res, req, 200, leadsPage(url)));
  }
  if (url.pathname === '/lead-inbox') {
    const waiting = { totalCount: origin.inboxWaiting, past24Hours: 0, oldestAt: null };
    return send(res, req, 200, { items: [], currencyCode: 'INR', bySource: [], ...waiting });
  }
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, { leads: [], inboxWaiting: 0, failList: false, gate: null, asks: [] });
});

/** The list, mounted in the real provider over the origin, its first read settled. */
export async function mountedList(leads: LeadListRow[], inboxWaiting = 0) {
  origin.leads = structuredClone(leads);
  origin.inboxWaiting = inboxWaiting;
  const layer = createDataLayer({ baseUrl: server.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useLeadsListScreen(), { wrapper });
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'), {
    timeout: READ_RETRIES_MS,
  });
  return view;
}

export type ListView = Awaited<ReturnType<typeof mountedList>>;

/** The ids of the rows shown, in their order. */
export function shownIds(view: ListView): string[] {
  const { read } = view.result.current;
  return read.kind === 'ready' ? read.value.rows.map((row) => row.lead.id) : [];
}

/** The last `GET /leads` query, as its parameters. */
export const lastAsk = () => Object.fromEntries(origin.asks.at(-1) ?? []);
