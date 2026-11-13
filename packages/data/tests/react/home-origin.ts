import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  IDEMPOTENCY_KEY_HEADER,
  type MyDay,
  type MyDayItem,
  type OwnerDashboard,
  type SessionProjection,
} from '@heliogrid/contracts';
import {
  composedHome,
  ROLE_PRESETS,
  type RolePreset,
  showsMyDay,
  showsOwnerDashboard,
} from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { priya } from './lead-detail-origin';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';
import { READER, TENANT } from './projects-fixtures';

/**
 * My Day and the owner dashboard end to end through the real client (`packages/data/CLAUDE.md`,
 * Done means): an origin that keeps one rep's day and one owner's dashboard, answers a tick, a
 * move, a reopen, a logged call and a target the way the api does, and records every write.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const id = (n: number) => `01a70000-0000-7000-8000-${String(n).padStart(12, '0')}`;
export const NOW = '2026-11-12T06:00:00.000Z';

/* By domain's rules, never by spelling: whose home holds My Day, whose the dashboard. */
function presetWhere(test: (role: RolePreset) => boolean): RolePreset {
  const found = ROLE_PRESETS.find(test);
  if (found === undefined) throw new Error('no preset fits');
  return found;
}
export const REP = presetWhere((role) => showsMyDay(composedHome([role])));
export const OWNER = presetWhere((role) => showsOwnerDashboard(composedHome([role])));
export const NEITHER = presetWhere(
  (role) => !showsMyDay(composedHome([role])) && !showsOwnerDashboard(composedHome([role])),
);

/** One open task of mine on an active lead, due at `dueAt`, in `band`. */
export function anItem(n: number, band: MyDayItem['band'], dueAt: string): MyDayItem {
  return {
    task: {
      id: id(100 + n),
      leadId: id(200 + n),
      kind: 'follow_up',
      title: null,
      status: 'open',
      dueAt,
      assignee: { userId: READER.userId, name: READER.name },
      provenance: 'manual',
      doneAt: null,
    },
    band,
    lead: {
      id: id(200 + n),
      customerId: id(300 + n),
      name: `Lead ${n}`,
      phoneE164: '+919822014567',
      city: 'Pune',
      segment: 'residential',
      source: 'walk_in',
      stage: 'contacted',
      state: null,
      owner: { userId: READER.userId, name: READER.name },
      monthlyBill: { amount: '4200.00', tier: 'measured' },
      value: null,
      createdAt: '2026-11-01T05:00:00.000Z',
      lastActivityAt: '2026-11-10T05:00:00.000Z',
    },
    canDial: true,
    visitPlace: null,
  } as MyDayItem;
}

/** A day of `overdue`, `today` and `week` items, oldest first, the oldest the next one up. */
export function aDay(overdue: number, today: number, week: number): MyDay {
  const items = [
    ...Array.from({ length: overdue }, (_, at) =>
      anItem(
        at + 1,
        'overdue',
        `2026-11-${String(10 - Math.min(at, 8)).padStart(2, '0')}T04:00:00.000Z`,
      ),
    ),
    ...Array.from({ length: today }, (_, at) =>
      anItem(50 + at, 'today', `2026-11-12T${String(8 + at).padStart(2, '0')}:00:00.000Z`),
    ),
    ...Array.from({ length: week }, (_, at) => anItem(80 + at, 'week', '2026-11-15T05:00:00.000Z')),
  ].sort((a, b) => a.task.dueAt.localeCompare(b.task.dueAt));
  return {
    today: '2026-11-12',
    timeZone: 'Asia/Kolkata',
    currencyCode: 'INR',
    nextTaskId: items.find((item) => item.band !== 'week')?.task.id ?? null,
    items,
    counts: { overdue, today, week, doneToday: 2 },
  };
}

export function aDashboard(): OwnerDashboard {
  return {
    scope: 'company',
    today: '2026-11-12',
    month: '2026-11',
    currencyCode: 'INR',
    needsYou: {
      unassigned: {
        count: 2,
        oldestHours: 26,
        leadIds: ['01a70000-0000-7000-8000-0000000000a1', '01a70000-0000-7000-8000-0000000000a2'],
        suggested: {
          userId: '01a70000-0000-7000-8000-0000000000b1',
          name: 'Ravi Kulkarni',
          openLeads: 3,
        },
      },
      paymentsLate: { count: 0, amount: '0.00', oldestDays: null, oldestProjectId: null },
      blockedOnUs: { count: 1, oldest: { projectId: id(900), name: 'Deshmukh', days: 6 } },
      waitingLongest: [],
      myOverdueTasks: 3,
    },
    cash: {
      collectedThisMonth: '1840000.00',
      collectedLastMonth: '1640000.00',
      toCollect: '620000.00',
      late: { count: 0, amount: '0.00' },
    },
    won: {
      thisMonth: { count: 6, amount: '2460000.00' },
      lastMonth: { count: 5, amount: '2100000.00' },
      median: { amount: '310000.00', of: 13 },
    },
    target: null,
    canSetTarget: true,
    pipeline: [
      { stage: 'new', count: 8 },
      { stage: 'contacted', count: 12 },
    ],
    winLoss: { windowDays: 90, won: 13, lost: 29, lostReasons: [{ reason: 'price', count: 9 }] },
  };
}

export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  roles: readonly RolePreset[];
  day: MyDay;
  dashboard: OwnerDashboard;
  /** The next answers to a write, in order, keyed by its last path segment. */
  answers: Map<string, Answer[]>;
  sent: string[];
  writes: { method: string; path: string; body: unknown }[];
}

const START = (): Origin => ({
  roles: [REP],
  day: aDay(4, 2, 1),
  dashboard: aDashboard(),
  answers: new Map(),
  sent: [],
  writes: [],
});

export const origin: Origin = START();

export function answerNext(key: string, ...answers: Answer[]) {
  origin.answers.set(key, [...(origin.answers.get(key) ?? []), ...answers]);
}

export const readsOf = (prefix: string) =>
  origin.sent.filter((one) => one.startsWith(`GET ${prefix}`));
export const writesTo = (suffix: string) =>
  origin.writes.filter((write) => write.path.endsWith(suffix));

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER.userId,
      phoneE164: '+919900000002',
      displayName: READER.name,
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: origin.roles, authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

async function answerWrite(req: IncomingMessage, res: ServerResponse, success: Answer) {
  const url = new URL(req.url ?? '/', 'http://origin');
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.writes.push({ method: req.method ?? '', path: url.pathname, body: write.body });
  void req.headers[IDEMPOTENCY_KEY_HEADER];
  const key = url.pathname.split('/').at(-1) ?? '';
  const answer = origin.answers.get(key)?.shift() ?? success;
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

/** The task a tick, a move or a reopen answers with, as the api's `taskSchema`. */
function taskAfter(path: string, status: 'open' | 'done') {
  const taskId = path.split('/')[2] ?? '';
  const item = origin.day.items.find((one) => one.task.id === taskId) ?? origin.day.items[0];
  return { ...item?.task, status, doneAt: status === 'done' ? NOW : null };
}

/** What a write answers when its test queued nothing else; `null` for a route this origin lacks. */
function writeAnswerOf(method: string, path: string): Answer | null {
  if (method === 'PUT' && path === '/dashboards/target') {
    return { status: 200, body: { target: { amount: '3000000.00' } } };
  }
  if (method === 'POST' && path === '/leads/assign') return { status: 200, body: { results: [] } };
  if (path.startsWith('/tasks/')) {
    return { status: 200, body: taskAfter(path, path.endsWith('/done') ? 'done' : 'open') };
  }
  if (method === 'POST' && path.endsWith('/calls')) return { status: 201, body: priya() };
  return null;
}

const served = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  const path = url.pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.sent.push(`${req.method} ${path}${url.search}`);
  if (path === '/auth/session') return send(res, req, 200, projection());
  if (req.method === 'GET' && path === '/my-day') return send(res, req, 200, origin.day);
  if (req.method === 'GET' && path === '/dashboards/owner') {
    return send(res, req, 200, origin.dashboard);
  }
  const success = writeAnswerOf(req.method ?? '', path);
  if (success !== null) return void answerWrite(req, res, success);
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, START());
});

/** A hook mounted in the real provider over the origin. */
export function mountedOver<T>(hook: () => T) {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper });
}

/** Long enough for a read the hook would send to have reached the origin. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
