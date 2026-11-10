import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DedupeMatchWire, LeadDetail, SessionProjection } from '@heliogrid/contracts';
import { can, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * Quick add's routes end to end through the real client (`packages/data/CLAUDE.md`, Done means):
 * the session, the company, the live number check, one lead's read, and the capture's three writes,
 * each answered in the contract's shapes the way a case sets.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
/** A preset that may add leads but not keep a duplicate beside its match (`crm.dedupe_override`). */
export const NO_OVERRIDE: readonly RolePreset[] = ROLE_PRESETS.filter(
  (role) => !can([role], 'crm.dedupe_override'),
).slice(0, 1);
const TENANT = '01a40000-0000-7000-8000-000000000001';
const USER = '01a40000-0000-7000-8000-000000000002';
export const LEAD_ID = '01a40000-0000-7000-8000-000000000011';
export const CUSTOMER_ID = '01a40000-0000-7000-8000-000000000012';
export const REFERRER_LEAD_ID = '01a40000-0000-7000-8000-000000000021';
export const REFERRER_CUSTOMER_ID = '01a40000-0000-7000-8000-000000000022';
export const NEW_LEAD_ID = '01a40000-0000-7000-8000-000000000031';
/** The national number as typed into the field, and the E.164 it is stored as. */
export const TYPED = '+919822041234';
const AT = '2026-11-09T09:05:00.000Z';

export function leadDetail(id: string, customerId: string, name: string | null): LeadDetail {
  return {
    currencyCode: 'INR',
    lead: {
      id,
      customerId,
      name,
      phoneE164: TYPED,
      city: null,
      segment: null,
      source: 'quick_add',
      stage: 'new',
      state: null,
      owner: null,
      monthlyBill: null,
      value: null,
      createdAt: AT,
      lastActivityAt: AT,
    },
    customer: {
      id: customerId,
      name,
      phoneE164: TYPED,
      city: null,
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
      reopenCount: 0,
    },
    unansweredCalls: 0,
    canDial: true,
    cameFrom: null,
    visit: null,
    openTasks: [],
    sections: { designs: 0, proposals: 0, files: 0 },
  };
}

export const PRIYA: DedupeMatchWire = {
  kind: 'visible',
  leadId: LEAD_ID,
  customerId: CUSTOMER_ID,
  name: 'Priya Sharma',
  city: 'Nashik',
  ownerName: 'Rajesh Jadhav',
  stage: 'qualified',
  lastContactAt: AT,
};

export const OUTSIDE: DedupeMatchWire = {
  kind: 'out_of_scope',
  leadId: LEAD_ID,
  ownerName: 'Rajesh Jadhav',
  stage: 'negotiating',
  lastContactAt: null,
};

/** What the origin answers a request with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface QuickAddOrigin {
  roles: readonly RolePreset[];
  segment: 'residential' | 'ci' | 'both' | null;
  /** The live check's answer for every number. */
  match: DedupeMatchWire | null | Answer;
  /** The next answers to the capture's writes, in order; an exhausted list answers success. */
  writes: Answer[];
  /** Every request's method and path, in order. */
  sent: string[];
  /** Every write's body and retry key, in order. */
  bodies: unknown[];
  keys: string[];
}

const START: QuickAddOrigin = {
  roles: [OWNER_ROLE],
  segment: null,
  match: null,
  writes: [],
  sent: [],
  bodies: [],
  keys: [],
};

export const origin: QuickAddOrigin = structuredClone(START);

const isAnswer = (value: QuickAddOrigin['match']): value is Answer =>
  value === 'drop' || (value !== null && 'status' in value);

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

const company = () => ({
  id: TENANT,
  companyName: 'Suryodaya Solar',
  city: 'Pune',
  marketCode: 'IN',
  currencyCode: 'INR',
  defaultLanguage: 'en',
  timezone: 'Asia/Kolkata',
  segment: origin.segment,
  typicalSystemKwp: null,
});

function answerWith(req: IncomingMessage, res: ServerResponse, answer: Answer) {
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

/** A capture write: the next queued answer, else what the route answers on success. */
async function answerWrite(req: IncomingMessage, res: ServerResponse, success: Answer) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.bodies.push(write.body);
  origin.keys.push(String(req.headers['idempotency-key'] ?? ''));
  answerWith(req, res, origin.writes.shift() ?? success);
}

const served = listeningOrigin((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.sent.push(`${req.method} ${pathname}`);
  if (pathname === '/auth/session') return send(res, req, 200, projection());
  if (pathname === '/tenants/me') return send(res, req, 200, company());
  if (pathname === '/customers/match') {
    const { match } = origin;
    return isAnswer(match) ? answerWith(req, res, match) : send(res, req, 200, { match });
  }
  if (pathname === `/leads/${REFERRER_LEAD_ID}`) {
    return send(res, req, 200, leadDetail(REFERRER_LEAD_ID, REFERRER_CUSTOMER_ID, 'Meera Joshi'));
  }
  const created = { status: 201, body: leadDetail(NEW_LEAD_ID, CUSTOMER_ID, null) };
  if (pathname === '/leads' && req.method === 'POST') return void answerWrite(req, res, created);
  if (pathname === `/leads/${LEAD_ID}/enquiries`) {
    const { match } = origin;
    const outside = !isAnswer(match) && match?.kind === 'out_of_scope';
    return void answerWrite(req, res, {
      status: 201,
      body: outside
        ? { leadId: LEAD_ID, loggedAt: AT }
        : leadDetail(LEAD_ID, CUSTOMER_ID, 'Priya Sharma'),
    });
  }
  if (pathname === `/leads/${LEAD_ID}/owner-requests`) {
    const sent = { leadId: LEAD_ID, ownerName: 'Rajesh Jadhav', requestedAt: AT };
    return void answerWrite(req, res, { status: 201, body: sent });
  }
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, structuredClone(START));
});

/** The writes sent so far, by method and path. */
export const writesSent = () => origin.sent.filter((request) => !request.startsWith('GET'));

/** A hook mounted in the real provider over the origin. */
export function mountedOver<T>(hook: () => T) {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper });
}
