import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Assignee, LeadDetail, LeadSummary, SessionProjection } from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useLeadInboxScreen } from '../../src/react/use-lead-inbox-screen';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * The Lead Inbox end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that keeps the unassigned queue and the people a lead can go to, and answers each assign,
 * junk and bulk assign the way a case needs — held until the test lets it go, refused, or dropped.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export const [OWNER_ROLE, SALES_MANAGER, SALES_EXECUTIVE] = ROLE_PRESETS;
const TENANT = '01a40000-0000-7000-8000-000000000001';
const READER = '01a40000-0000-7000-8000-000000000002';
const NOW = Date.now();
/** Longer than the client's retries of a read that gets no readable answer. */
export const READ_RETRIES_MS = 10_000;
const HOUR = 3_600_000;

export const RAJESH: Assignee = {
  userId: '01a40000-0000-7000-8000-000000000011',
  name: 'Rajesh Jadhav',
  openCount: 18,
  overdueCount: 2,
};
export const NEHA: Assignee = {
  userId: '01a40000-0000-7000-8000-000000000012',
  name: 'Neha Kulkarni',
  openCount: 9,
  overdueCount: 0,
};
/** Deactivated: the server never lists them, so no face or picker row may offer them (`M02-28`). */
export const ANJALI_DEACTIVATED = '01a40000-0000-7000-8000-000000000013';

export function lead(n: number, name: string | null, hoursAgo: number): LeadSummary {
  return {
    id: `01a40000-0000-7000-8000-0000000001${String(n).padStart(2, '0')}`,
    customerId: `01a40000-0000-7000-8000-0000000002${String(n).padStart(2, '0')}`,
    name,
    phoneE164: `+9198220412${String(n).padStart(2, '0')}`,
    city: name === null ? null : 'Nashik',
    segment: 'residential',
    source: n % 2 === 0 ? 'import' : 'quick_add',
    stage: 'new',
    state: null,
    owner: null,
    monthlyBill: n === 1 ? { amount: '2400.00', tier: 'assumed' } : null,
    value: null,
    createdAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
    lastActivityAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
  };
}

/** Newest first: Priya 1 h, an unnamed lead 5 h, Amit 30 h. */
export const PRIYA = lead(1, 'Priya Sharma', 1);
export const UNNAMED = lead(2, null, 5);
export const AMIT = lead(3, 'Amit Patil', 30);

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  queue: LeadSummary[];
  people: Assignee[];
  /** The next answers to each write, by route, in order; an exhausted list answers as the api would. */
  assigns: Answer[];
  junks: Answer[];
  bulks: Answer[];
  /** While set, every write waits for it — the act is out until the test lets it go. */
  gate: Promise<void> | null;
  writes: { path: string; body: unknown }[];
  failInbox: boolean;
  /** The reader's roles, as their session carries them. */
  roles: RolePreset[];
}

export const origin: Origin = {
  queue: [],
  people: [],
  assigns: [],
  junks: [],
  bulks: [],
  gate: null,
  writes: [],
  failInbox: false,
  roles: [OWNER_ROLE],
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

function detailOf(summary: LeadSummary, owner: Assignee | null): LeadDetail {
  return {
    currencyCode: 'INR',
    lead: { ...summary, owner: owner === null ? null : { userId: owner.userId, name: owner.name } },
    customer: {
      id: summary.customerId,
      name: summary.name,
      phoneE164: summary.phoneE164,
      city: summary.city,
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

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER,
      phoneE164: '+919900000001',
      displayName: 'Asha Patil',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: origin.roles as [RolePreset], authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

function inboxPage(url: URL) {
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const page = Number(url.searchParams.get('page') ?? '1');
  const waitedPastDay = origin.queue.filter((one) => Date.parse(one.createdAt) < NOW - 24 * HOUR);
  return {
    items: origin.queue.slice((page - 1) * limit, page * limit),
    totalCount: origin.queue.length,
    currencyCode: 'INR',
    bySource: [],
    past24Hours: waitedPastDay.length,
    oldestAt: origin.queue.at(-1)?.createdAt ?? null,
  };
}

/** Takes a lead out of the unassigned queue — assigned or binned, by this person or another. */
const leave = (id: string) => {
  origin.queue = origin.queue.filter((one) => one.id !== id);
};

async function answerWrite(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.writes.push({ path, body: write.body });
  if (origin.gate !== null) await origin.gate;
  const assign = /^\/leads\/([^/]+)\/assign$/.exec(path);
  const junk = /^\/leads\/([^/]+)\/junk$/.exec(path);
  const queue = assign ? origin.assigns : junk ? origin.junks : origin.bulks;
  const answer = queue.shift();
  if (answer === 'drop') return void req.socket.destroy();
  if (answer !== undefined) return send(res, req, answer.status, answer.body);
  if (assign || junk) {
    const id = (assign ?? junk)?.[1] ?? '';
    const found = origin.queue.find((one) => one.id === id);
    if (found === undefined) return send(res, req, 404, refusal('NOT_FOUND'));
    const to = origin.people.find(
      (one) => one.userId === (write.body as { assigneeId?: string }).assigneeId,
    );
    leave(id);
    return send(res, req, 200, detailOf(found, to ?? null));
  }
  const { leadIds } = write.body as { leadIds: string[] };
  for (const id of leadIds) leave(id);
  send(res, req, 200, { results: leadIds.map((leadId) => ({ leadId, outcome: 'assigned' })) });
}

const server = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === '/lead-inbox') {
    if (origin.failInbox) return send(res, req, 500, refusal('INTERNAL'));
    return send(res, req, 200, inboxPage(url));
  }
  if (url.pathname === '/lead-assignees') return send(res, req, 200, { items: origin.people });
  if (req.method === 'POST' && url.pathname.startsWith('/leads/')) {
    return void answerWrite(req, res, url.pathname);
  }
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, {
    assigns: [],
    junks: [],
    bulks: [],
    gate: null,
    writes: [],
    failInbox: false,
    roles: [OWNER_ROLE],
  });
});

/** The inbox, mounted in the real provider over the origin, its queue and its people read. */
export async function mountedInbox(queue: LeadSummary[] = [PRIYA, UNNAMED, AMIT]) {
  origin.queue = structuredClone(queue);
  origin.people = [structuredClone(RAJESH), structuredClone(NEHA)];
  const layer = createDataLayer({ baseUrl: server.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useLeadInboxScreen(), { wrapper });
  /* Longer than the client's retries of a read the server refuses with a 5xx. */
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'), {
    timeout: READ_RETRIES_MS,
  });
  return view;
}

export type InboxView = Awaited<ReturnType<typeof mountedInbox>>;

/** The queue's lead ids, deck first among them in place. */
export const queueOf = (view: InboxView) =>
  view.result.current.view.queue.map((card) => card.lead.id);

export const cardOf = (view: InboxView, id: string) => {
  const card = view.result.current.view.queue.find((one) => one.lead.id === id);
  if (card === undefined) throw new Error(`no card ${id}`);
  return card;
};
