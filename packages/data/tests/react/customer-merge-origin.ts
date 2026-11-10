import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  Customer,
  MergePreview,
  SearchResults,
  SessionProjection,
} from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * Customer Merge's routes end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): the session, the merge preview either way round, the merge itself and the find step's
 * search — each answered in the contract's shapes the way a case sets.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE, , SALES_EXECUTIVE] = ROLE_PRESETS;
export const NO_MERGE: readonly RolePreset[] = [SALES_EXECUTIVE as RolePreset];
const TENANT = '01a60000-0000-7000-8000-000000000001';
const USER = '01a60000-0000-7000-8000-000000000002';
export const SUNITA_ID = '01a60000-0000-7000-8000-000000000011';
export const VINAYAK_ID = '01a60000-0000-7000-8000-000000000012';
export const SURVIVOR_LEAD_ID = '01a60000-0000-7000-8000-000000000021';

const SUNITA = {
  customerId: SUNITA_ID,
  name: 'Sunita Kulkarni',
  phoneE164: '+919823066710',
  city: 'Satara',
};
const VINAYAK = {
  customerId: VINAYAK_ID,
  name: 'Vinayak Kulkarni',
  phoneE164: '+919823041952',
  city: 'Godoli, Satara',
};
const MOVES = { contacts: 1, leads: 1, activities: 6, referrals: 0, visits: 1, tasks: 2, files: 0 };

/** The preview with `survivor` staying: name, city and primary contact all differ. */
export function previewOf(survivorId: string): MergePreview {
  const [survivor, loser] = survivorId === SUNITA_ID ? [SUNITA, VINAYAK] : [VINAYAK, SUNITA];
  const primary = (side: typeof SUNITA) => (side === VINAYAK ? 'Vinayak (husband)' : null);
  return {
    blocked: null,
    heldBy: null,
    survivor,
    loser,
    differences: [
      { field: 'name', survivor: survivor.name, loser: loser.name },
      { field: 'city', survivor: survivor.city, loser: loser.city },
      { field: 'primary_contact', survivor: primary(survivor), loser: primary(loser) },
    ],
    moves: MOVES,
  };
}

export const BLOCKED_OUTSIDE: MergePreview = {
  blocked: 'out_of_scope',
  heldBy: 'Rajesh Jadhav',
  survivor: null,
  loser: null,
  differences: [],
  moves: null,
};

const survivorRecord = (): Customer => ({
  id: SUNITA_ID,
  name: SUNITA.name,
  phoneE164: SUNITA.phoneE164,
  city: VINAYAK.city,
  preferredLanguage: null,
  doNotCall: false,
  wrongNumber: false,
  primaryContactId: null,
  contacts: [],
  keptDuplicates: [],
  referred: [],
});

/** What the origin answers a request with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface CustomerMergeOrigin {
  roles: readonly RolePreset[];
  /** The preview's answer, else the pair as `previewOf` reads it. */
  preview: Answer | null;
  /** The next answers to the merge, in order; an exhausted list answers the merged survivor. */
  merges: Answer[];
  /** While set, every merge waits for it — the act is out until the test lets it go. */
  gate: Promise<void> | null;
  /** Every request's method and path (with a preview's pair), in order. */
  sent: string[];
  bodies: unknown[];
}

const START: CustomerMergeOrigin = {
  roles: [OWNER_ROLE as RolePreset],
  preview: null,
  merges: [],
  gate: null,
  sent: [],
  bodies: [],
};

export const origin: CustomerMergeOrigin = structuredClone(START);

function projection(): SessionProjection {
  return {
    actor: {
      userId: USER,
      phoneE164: '+919999999901',
      displayName: 'Asha Patil',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: origin.roles, authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

/** The search finds the survivor and the other record — the find step must drop the first. */
function found(): SearchResults {
  const customer = (side: typeof SUNITA) => ({
    id: side.customerId,
    name: side.name,
    phoneE164: side.phoneE164,
    city: side.city,
  });
  const none = { total: 0, items: [] };
  return {
    leads: none,
    customers: { total: 2, items: [customer(SUNITA), customer(VINAYAK)] },
    people: none,
    catalog: none,
  };
}

function answerWith(req: IncomingMessage, res: ServerResponse, answer: Answer) {
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

async function answerMerge(req: IncomingMessage, res: ServerResponse) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.bodies.push(write.body);
  await origin.gate;
  const merged = { status: 200, body: { survivor: survivorRecord(), leadId: SURVIVOR_LEAD_ID } };
  answerWith(req, res, origin.merges.shift() ?? merged);
}

const served = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === '/customers/merge-preview') {
    const survivorId = url.searchParams.get('survivorId') ?? '';
    origin.sent.push(`GET preview ${survivorId === SUNITA_ID ? 'sunita' : 'vinayak'} stays`);
    return answerWith(req, res, origin.preview ?? { status: 200, body: previewOf(survivorId) });
  }
  origin.sent.push(`${req.method} ${url.pathname}`);
  if (url.pathname === '/customers/merge') return void answerMerge(req, res);
  if (url.pathname === '/search') return send(res, req, 200, found());
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, structuredClone(START));
});

/** The merges sent so far. */
export const mergesSent = () =>
  origin.sent.filter((request) => request === 'POST /customers/merge');

/** A hook mounted in the real provider over the origin. */
export function mountedOver<T>(hook: () => T) {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper });
}
