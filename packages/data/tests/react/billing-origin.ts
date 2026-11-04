import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  BillingDocumentRow,
  BillingHome,
  BillingStanding,
  PlanChangePreview,
  SessionProjection,
} from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { type BillingHomeAdapter, useBillingHomeScreen } from '../../src/react/use-billing-home';
import { useBillingDocuments, useBillingReminders } from '../../src/react/use-billing-records';
import {
  type PlanSelectionAdapter,
  usePlanSelectionScreen,
} from '../../src/react/use-plan-selection';
import { useSession } from '../../src/react/use-session';
import {
  CHECKOUT_URL,
  CREDIT_NOTE,
  homeOf,
  NEXT_NOTICE,
  RUNS_UNTIL,
  SIGNED_URL,
} from './billing-home-fixtures';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';
import { BOOK, PAGE_URL, TENANT_READ, upgradeOf } from './plan-selection-fixtures';

export { refusal } from './origin-wire';

/**
 * Billing (`SCR-M12-02`) end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): the hooks, the transport and the repository against an origin that answers the session,
 * the billing reads, the three acts and the owners in the contract's shapes. The tests that import
 * this share one origin, mounted in the real provider.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* By place in F2's order, never by spelling: a role name is the permission model's to write. */
export const [OWNER_ROLE, , SALES] = ROLE_PRESETS;
const TENANT = '01a40000-0000-7000-8000-000000000001';
const USER = '01a40000-0000-7000-8000-000000000002';
/** What the origin answers an act with: a status and body, or later. */
export interface Answer {
  status: number;
  body?: unknown;
  afterMs?: number;
}

export interface Request {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
}

interface Origin {
  roles: RolePreset[];
  home: BillingHome;
  /** The next answers to each act; an exhausted list answers 200. */
  acts: {
    checkout: Answer[];
    cancel: Answer[];
    refund: Answer[];
    change: Answer[];
    withdraw: Answer[];
  };
  /** The preview each read answers, in order; the last stands once the list is spent. */
  previews: PlanChangePreview[];
  /** The next answers to a document's download link; an exhausted list signs it. */
  downloads: Answer[];
  documents: BillingDocumentRow[];
  reminders: { id: string; notice: string; firedAt: string; clearedAt: null; paidAt: null }[];
  /** Every request but the session's and the preflight's, in order. */
  requests: Request[];
}

export const origin: Origin = {
  roles: [OWNER_ROLE],
  home: homeOf('active'),
  acts: { checkout: [], cancel: [], refund: [], change: [], withdraw: [] },
  previews: [upgradeOf()],
  downloads: [],
  documents: [],
  reminders: [],
  requests: [],
};

function projection(): SessionProjection {
  return {
    actor: {
      userId: USER,
      phoneE164: '+919999999901',
      displayName: 'Rajesh Sharma',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: {
      tenantId: TENANT,
      roles: origin.roles as [RolePreset, ...RolePreset[]],
      authorizationVersion: 1,
    },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

const standingOf = (): BillingStanding => origin.home.standing;

function pageOf<T>(items: readonly T[], query: Record<string, string>) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 50);
  return { items: items.slice((page - 1) * limit, page * limit), totalCount: items.length };
}

async function answerAct(
  req: IncomingMessage,
  res: ServerResponse,
  list: Answer[],
  ok: unknown,
  request: Request,
) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.requests.push({ ...request, body: write.body });
  const answer = list.shift() ?? { status: 200 };
  if (answer.afterMs) await new Promise((resolve) => setTimeout(resolve, answer.afterMs));
  send(res, req, answer.status, answer.body ?? ok);
}

function answerRead(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://origin');
  const path = url.pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (path === '/auth/session') return send(res, req, 200, projection());
  const query = Object.fromEntries(url.searchParams);
  const request: Request = { method: req.method ?? 'GET', path, query, body: undefined };
  if (req.method === 'POST') return answerPost(req, res, request);
  origin.requests.push(request);
  if (path === '/billing/home') return send(res, req, 200, origin.home);
  if (path === '/billing/standing') return send(res, req, 200, standingOf());
  if (path === '/tenants/me/owners')
    return send(res, req, 200, { owners: [{ name: 'Rajesh Sharma' }], more: 0 });
  if (path === '/tenants/me') return send(res, req, 200, TENANT_READ);
  if (path === '/pricing/IN') return send(res, req, 200, BOOK);
  if (path === '/billing/plan-change/preview') {
    const preview = origin.previews.length > 1 ? origin.previews.shift() : origin.previews[0];
    return send(res, req, 200, preview);
  }
  answerRecords(req, res, request);
}

function answerPost(req: IncomingMessage, res: ServerResponse, request: Request) {
  const acts: Record<string, [Answer[], unknown]> = {
    '/billing/checkout': [origin.acts.checkout, { checkoutUrl: CHECKOUT_URL }],
    '/billing/cancel': [origin.acts.cancel, { runsUntil: RUNS_UNTIL }],
    '/billing/refund': [origin.acts.refund, { creditNoteNumber: CREDIT_NOTE }],
    '/billing/plan-change': [origin.acts.change, { outcome: 'page', checkoutUrl: PAGE_URL }],
    '/billing/plan-change/withdraw': [origin.acts.withdraw, { withdrawn: true }],
  };
  const act = acts[request.path];
  if (act) return void answerAct(req, res, act[0], act[1], request);
  send(res, req, 404, refusal('NOT_FOUND'));
}

/** The record lists and a document's signed link. */
function answerRecords(req: IncomingMessage, res: ServerResponse, { path, query }: Request) {
  if (path === '/billing/documents') {
    const q = query.q ?? '';
    const under = origin.documents.filter((row) => row.number.includes(q));
    const shown = under.filter((row) => query.status === undefined || row.status === query.status);
    const count = (status: string) => under.filter((row) => row.status === status).length;
    return send(res, req, 200, {
      ...pageOf(shown, query),
      currencyCode: 'INR',
      counts: { all: under.length, paid: count('paid'), failed: count('failed') },
    });
  }
  if (path === '/billing/reminders') {
    const next = Number(query.page ?? 1) === 1 ? NEXT_NOTICE : null;
    return send(res, req, 200, { ...pageOf(origin.reminders, query), next });
  }
  if (/^\/billing\/documents\/[^/]+\/download-url$/.test(path)) {
    const answer = origin.downloads.shift() ?? { status: 200 };
    const signed = { url: SIGNED_URL, expiresAt: '2099-01-01T00:00:00.000Z' };
    return send(res, req, answer.status, answer.body ?? signed);
  }
  send(res, req, 404, refusal('NOT_FOUND'));
}

const listening = listeningOrigin(answerRead);

afterEach(() => {
  cleanup();
  Object.assign(origin, {
    roles: [OWNER_ROLE],
    home: homeOf('active'),
    acts: { checkout: [], cancel: [], refund: [], change: [], withdraw: [] },
    previews: [upgradeOf()],
    downloads: [],
    documents: [],
    reminders: [],
    requests: [],
  });
});

const wrapperOf = () => {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  return ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
};

/** Every request made to `path`, in order. */
export const requestsTo = (path: string, method = 'GET') =>
  origin.requests.filter((r) => r.path === path && r.method === method);

/** The app's two ways out of the page, recording what they were asked. */
export function recordingAdapter() {
  const told = { opened: [] as string[], plans: 0 };
  const adapter: BillingHomeAdapter = {
    openExternal: (url) => told.opened.push(url),
    toPlans: () => {
      told.plans += 1;
    },
  };
  return { adapter, told };
}

/** The page, mounted in the real provider over the origin, once its read has answered. */
export async function mounted() {
  const { adapter, told } = recordingAdapter();
  const view = renderHook(() => useBillingHomeScreen(adapter), { wrapper: wrapperOf() });
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  if (!view.result.current.owner) {
    await waitFor(() => {
      const { read } = view.result.current;
      expect(
        read.kind === 'ready' && read.value.kind === 'member' && read.value.owners !== null,
      ).toBe(true);
    });
  }
  return Object.assign(view, { told });
}

/** The record lists, mounted with their sheet shut or open; the session answers first. */
export async function mountedRecords(open: boolean) {
  const view = renderHook(
    ({ isOpen }: { isOpen: boolean }) => ({
      session: useSession(),
      documents: useBillingDocuments(isOpen),
      reminders: useBillingReminders(isOpen),
    }),
    { wrapper: wrapperOf(), initialProps: { isOpen: open } },
  );
  await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBe(TENANT));
  return view;
}

/** The plans' ways out, recording what they were asked. */
export function recordingPlansAdapter() {
  const told = { opened: [] as string[], billing: 0 };
  const adapter: PlanSelectionAdapter = {
    openExternal: (url) => told.opened.push(url),
    toBilling: () => {
      told.billing += 1;
    },
  };
  return { adapter, told };
}

/** The plans screen, mounted in the real provider over the origin, once both reads answered. */
export async function mountedPlans() {
  const { adapter, told } = recordingPlansAdapter();
  const view = renderHook(() => usePlanSelectionScreen(adapter), { wrapper: wrapperOf() });
  await waitFor(() => {
    expect(view.result.current.plan.kind).toBe('ready');
    expect(view.result.current.book.kind).toBe('ready');
  });
  return Object.assign(view, { told });
}
