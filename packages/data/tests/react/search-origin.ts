import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LeadDetail, SearchResults, SessionProjection } from '@heliogrid/contracts';
import { IN_FORMATS, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useSearchScreen } from '../../src/react/use-search-screen';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * Global Search end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that answers `GET /search` from a list of leads, counts every query it was asked, and
 * answers a junk lead's Reopen the way a case needs — held until the test lets it go, refused, or
 * as the api would.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
const TENANT = '01a50000-0000-7000-8000-000000000001';
const READER = '01a50000-0000-7000-8000-000000000002';
/** Longer than the client's retries of a read that gets no readable answer. */
export const READ_RETRIES_MS = 10_000;

type SearchLead = SearchResults['leads']['items'][number];

export const PRIYA: SearchLead = {
  id: '01a50000-0000-7000-8000-000000000101',
  name: 'Priya Sharma',
  phoneE164: '+919822014567',
  city: 'Nashik',
  stage: 'contacted',
  state: null,
  source: 'referral',
  ownerName: 'Rajesh Jadhav',
};
export const SURESH_JUNK: SearchLead = {
  id: '01a50000-0000-7000-8000-000000000102',
  name: 'Suresh Kamble',
  phoneE164: '+919822036941',
  city: 'Sangli',
  stage: 'new',
  state: 'junk',
  source: 'quick_add',
  ownerName: null,
};

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  leads: SearchLead[];
  /** Every `q` the origin was asked, in order. */
  asked: string[];
  failSearch: boolean;
  reopens: Answer[];
  /** While set, every write waits for it — the act is out until the test lets it go. */
  gate: Promise<void> | null;
  writes: { path: string; body: unknown }[];
}

export const origin: Origin = {
  leads: [],
  asked: [],
  failSearch: false,
  reopens: [],
  gate: null,
  writes: [],
};

/** Holds every write until `release` is called. */
export function holdWrites(): () => void {
  let release = () => {};
  origin.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return () => {
    origin.gate = null;
    release();
  };
}

const NONE = { total: 0, items: [] };

/** A lead whose number begins with the digits typed, or whose name or city a word begins. */
function resultsFor(q: string): SearchResults {
  const digits = q.replace(/\D/g, '');
  const word = q.toLowerCase();
  const found = origin.leads.filter(
    (lead) =>
      (digits !== '' && lead.phoneE164.startsWith(`+91${digits}`)) ||
      `${lead.name ?? ''} ${lead.city ?? ''}`
        .toLowerCase()
        .split(' ')
        .some((w) => w.startsWith(word)),
  );
  return {
    leads: { total: found.length, items: found },
    customers: NONE,
    people: NONE,
    catalog: NONE,
  };
}

function reopened(lead: SearchLead): LeadDetail {
  const at = '2026-11-09T09:00:00.000Z';
  return {
    currencyCode: 'INR',
    lead: {
      id: lead.id,
      customerId: '01a50000-0000-7000-8000-000000000201',
      name: lead.name,
      phoneE164: lead.phoneE164,
      city: lead.city,
      segment: null,
      source: lead.source,
      stage: lead.stage,
      state: null,
      owner: null,
      monthlyBill: null,
      value: null,
      createdAt: at,
      lastActivityAt: at,
    },
    customer: {
      id: '01a50000-0000-7000-8000-000000000201',
      name: lead.name,
      phoneE164: lead.phoneE164,
      city: lead.city,
      preferredLanguage: null,
      doNotCall: false,
      wrongNumber: false,
      primaryContactId: null,
      contacts: [],
      keptDuplicates: [],
      referred: [],
    },
    qualify: {
      roofOwnership: null,
      roofType: null,
      shading: null,
      timeline: null,
      decisionMaker: null,
    },
    qualifiedAt: null,
    lifecycle: {
      wakeOn: null,
      resurfaceOn: null,
      noCallUntil: null,
      lastClose: null,
      reopenCount: 1,
    },
    unansweredCalls: 0,
    canDial: true,
    cameFrom: null,
    visit: null,
    openTasks: [],
    sections: { designs: 0, proposals: 0, files: 0 },
  };
}

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER,
      phoneE164: '+919900000001',
      displayName: 'Asha Patil',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: [OWNER_ROLE] as [RolePreset], authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

async function answerReopen(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.writes.push({ path, body: write.body });
  if (origin.gate !== null) await origin.gate;
  const answer = origin.reopens.shift();
  if (answer === 'drop') return void req.socket.destroy();
  if (answer !== undefined) return send(res, req, answer.status, answer.body);
  const lead = origin.leads.find((one) => path === `/leads/${one.id}/reopen`);
  if (lead === undefined) return send(res, req, 404, refusal('NOT_FOUND'));
  lead.state = null;
  send(res, req, 200, reopened(lead));
}

const server = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === '/search') {
    const q = url.searchParams.get('q') ?? '';
    origin.asked.push(q);
    if (origin.failSearch) return send(res, req, 500, refusal('INTERNAL'));
    return send(res, req, 200, resultsFor(q));
  }
  if (req.method === 'POST' && /^\/leads\/[^/]+\/reopen$/.test(url.pathname)) {
    return void answerReopen(req, res, url.pathname);
  }
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, { asked: [], failSearch: false, reopens: [], gate: null, writes: [] });
});

/** The search, mounted in the real provider over the origin, nothing typed yet. */
export function mountedSearch(leads: SearchLead[] = [PRIYA, SURESH_JUNK]) {
  origin.leads = structuredClone(leads);
  const layer = createDataLayer({ baseUrl: server.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(() => useSearchScreen({ pack: IN_FORMATS }), { wrapper });
}

export type SearchView = ReturnType<typeof mountedSearch>;

/** The drawn lead row with this id, or a failure naming it. */
export function leadRowOf(view: SearchView, id: string) {
  const { read } = view.result.current;
  if (read.kind !== 'ready') throw new Error(`no answer drawn: ${read.kind}`);
  const row = read.value.groups
    .flatMap((group) => group.rows)
    .find((one) => one.key === `lead:${id}`);
  if (row?.kind !== 'lead') throw new Error(`no lead row ${id}`);
  return row;
}
