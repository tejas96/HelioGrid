import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LeadDetail, SessionProjection } from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useLeadDetailScreen } from '../../src/react/use-lead-detail-screen';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * Lead Detail end to end through the real client (`packages/data/CLAUDE.md`, Done means): an origin
 * that keeps one lead, applies each field edit and act the way the api does, and answers a case the
 * way it needs — held until the test lets it go, refused with its facts, or dropped.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
const TENANT = '01a50000-0000-7000-8000-000000000001';
const READER = '01a50000-0000-7000-8000-000000000002';
export const LEAD_ID = '01a50000-0000-7000-8000-000000000101';
/** Longer than the client's retries of a read that gets no readable answer. */
export const READ_RETRIES_MS = 10_000;
/** Who the booking read offers, as the api names them: a surveyor and the reader, a rep. */
export const SURVEYORS = [
  { userId: '01a50000-0000-7000-8000-000000000301', name: 'Ganesh Pawar' },
  { userId: READER, name: 'Asha Patil' },
];

export function priya(): LeadDetail {
  return {
    currencyCode: 'INR',
    lead: {
      id: LEAD_ID,
      customerId: '01a50000-0000-7000-8000-000000000201',
      name: 'Priya Sharma',
      phoneE164: '+919822014567',
      city: 'Nashik',
      segment: 'residential',
      source: 'quick_add',
      stage: 'contacted',
      state: null,
      owner: { userId: READER, name: 'Asha Patil' },
      monthlyBill: null,
      value: null,
      createdAt: '2026-11-09T04:00:00.000Z',
      lastActivityAt: '2026-11-09T04:00:00.000Z',
    },
    customer: {
      id: '01a50000-0000-7000-8000-000000000201',
      name: 'Priya Sharma',
      phoneE164: '+919822014567',
      city: 'Nashik',
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

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  lead: LeadDetail;
  /** The lead has left the reader's scope: every read of it answers 404. */
  gone: boolean;
  /** The next answers to a write, keyed by what the write names — a field or an act — in order. */
  answers: Map<string, Answer[]>;
  /** While set, every write waits for it — the act is out until the test lets it go. */
  gate: Promise<void> | null;
  writes: { path: string; body: unknown }[];
}

export const origin: Origin = {
  lead: priya(),
  gone: false,
  answers: new Map(),
  gate: null,
  writes: [],
};

/** Queues `answers` for the next writes naming `key` — a field (`shading`) or an act (`wake`). */
export function answerNext(key: string, ...answers: Answer[]) {
  origin.answers.set(key, [...(origin.answers.get(key) ?? []), ...answers]);
}

/** Holds every write until the returned release is called. */
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

/** A refused transition, with domain's reason in its facts (`LEAD_TRANSITION_REFUSED`). */
export const transitionRefused = (reason: string) => ({
  error: { ...refusal('LEAD_TRANSITION_REFUSED').error, facts: { refusal: reason } },
});

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

/** The lead after an edit the api applied: each field sent lands where the read carries it. */
function edited(body: Record<string, unknown>): LeadDetail {
  const lead = structuredClone(origin.lead);
  for (const [field, value] of Object.entries(body)) {
    if (field === 'monthlyBill') {
      lead.lead.monthlyBill = value === null ? null : { amount: String(value), tier: 'assumed' };
    } else if (field in lead.qualify) Object.assign(lead.qualify, { [field]: value });
  }
  return lead;
}

/** The lead after an act the api applied. */
function acted(act: string, body: Record<string, unknown>): LeadDetail {
  const lead = structuredClone(origin.lead);
  if (act === 'snooze') {
    lead.lead.state = 'snoozed';
    lead.lifecycle.wakeOn = String(body.wakeOn);
  } else if (act === 'wake' || act === 'reopen') lead.lead.state = null;
  else if (act === 'junk') lead.lead.state = 'junk';
  else if (act === 'qualified') lead.lead.stage = 'qualified';
  return lead;
}

async function answerWrite(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const body = (write.body ?? {}) as Record<string, unknown>;
  origin.writes.push({ path, body });
  if (origin.gate !== null) await origin.gate;
  const act = /^\/leads\/[^/]+\/([a-z]+)$/.exec(path)?.[1];
  const key = act ?? Object.keys(body).find((field) => field !== 'capturedAt') ?? '';
  const answer = origin.answers.get(key)?.shift();
  if (answer === 'drop') return void req.socket.destroy();
  if (answer !== undefined) return send(res, req, answer.status, answer.body);
  origin.lead = act === undefined ? edited(body) : acted(act, body);
  send(res, req, 200, origin.lead);
}

const server = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': req.headers.origin ?? '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
    });
    return void res.end();
  }
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === '/visit-surveyors') return send(res, req, 200, { items: SURVEYORS });
  if (url.pathname === `/leads/${LEAD_ID}/activities`) {
    return send(res, req, 200, { items: [], totalCount: 0 });
  }
  if (url.pathname.startsWith(`/leads/${LEAD_ID}`) && req.method !== 'GET') {
    return void answerWrite(req, res, url.pathname);
  }
  if (url.pathname === `/leads/${LEAD_ID}`) {
    return origin.gone
      ? send(res, req, 404, refusal('NOT_FOUND'))
      : send(res, req, 200, origin.lead);
  }
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, { lead: priya(), gone: false, answers: new Map(), gate: null, writes: [] });
});

/** Lead Detail, mounted in the real provider over the origin, its lead read. */
export async function mountedLead() {
  const layer = createDataLayer({ baseUrl: server.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useLeadDetailScreen(LEAD_ID, 'Asia/Kolkata'), { wrapper });
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'), {
    timeout: READ_RETRIES_MS,
  });
  return view;
}

export type LeadView = Awaited<ReturnType<typeof mountedLead>>;

/** One qualify question as the card draws it now. */
export function questionOf(view: LeadView, question: string) {
  const { read } = view.result.current;
  if (read.kind !== 'ready') throw new Error(`the lead is ${read.kind}`);
  const found = read.value.view.qualify.questions.find((one) => one.question === question);
  if (found === undefined) throw new Error(`no ${question} on the card`);
  return found;
}
