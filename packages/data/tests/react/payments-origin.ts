import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  type CollectionsSettings,
  IDEMPOTENCY_KEY_HEADER,
  type MoneyDue,
  type ProjectPayments,
  type SessionProjection,
} from '@heliogrid/contracts';
import {
  composedHome,
  opensSettingsRow,
  ROLE_PRESETS,
  type RolePreset,
  showsMoneyDue,
} from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { collections, moneyDueOf } from './money-fixtures';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';
import { AT, FILE_ID, PROJECT_ID, READER, storedFile, TENANT, TODAY } from './projects-fixtures';

export { collections, moneyDueOf } from './money-fixtures';

/**
 * A project's money end to end through the real client (`packages/data/CLAUDE.md`, Done means):
 * an origin that keeps one project's payments, Money due and the collections settings, answers
 * each money act the way the api does, and stores a receipt photo through the file routes.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const id = (n: number) => `01a60000-0000-7000-8000-${String(n).padStart(12, '0')}`;
export const BOOKING = id(501);
export const INSTALL = id(502);
export const ENTRY = id(601);
/** A UTR already on a receipt that stands, as the origin keeps it. */
export const USED_UTR = '432187653390';

const part = (n: number, label: string, outstanding: string) => ({
  id: n === 1 ? BOOKING : INSTALL,
  position: n,
  label,
  share: '50',
  amount: '100000.00',
  dueOnStage: n === 1 ? 'won' : 'installation',
  state: n === 1 ? 'due' : 'upcoming',
  received: '0.00',
  outstanding,
  extra: '0.00',
  dueOn: n === 1 ? TODAY : null,
  waived: null,
  lastShared: null,
});

export function somePayments(): ProjectPayments {
  return {
    projectId: PROJECT_ID,
    number: 'PRJ-0042',
    name: 'Priya Sharma',
    stage: 'won',
    today: TODAY,
    money: {
      currencyCode: 'INR',
      total: '200000.00',
      collected: '0.00',
      toCollect: '100000.00',
      next: '100000.00',
    },
    parts: [part(1, 'Booking', '100000.00'), part(2, 'Installation', '100000.00')],
    entries: [],
    payTo: { upiId: 'epc@okaxis', payee: 'Sun EPC', bank: null, upiLimit: '100000.00' },
    // The installation part is over the UPI cap here, so it has no QR.
    requests: [
      {
        partId: BOOKING,
        amount: '100000.00',
        upiUri: 'upi://pay?pa=epc@okaxis&am=100000.00',
        overUpiLimit: false,
        note: 'PRJ-0042 · Booking',
        message: { language: 'mr', text: 'Pay ₹1,00,000' },
        chatUri: 'https://wa.me/919900000001?text=Pay',
      },
      {
        partId: INSTALL,
        amount: '100000.00',
        upiUri: null,
        overUpiLimit: true,
        note: 'PRJ-0042 · Installation',
        message: { language: 'mr', text: 'Pay by bank' },
        chatUri: null,
      },
    ],
    modes: ['upi', 'neft', 'cash'],
    acts: { record: true, waive: true, share: true },
  };
}

/** The payments after a payment of the whole booking part, its receipt numbered. */
export function paid(): ProjectPayments {
  const after = somePayments();
  after.entries.push({
    id: ENTRY,
    partId: BOOKING,
    kind: 'payment',
    amount: '100000.00',
    mode: 'upi',
    reference: 'UTR1',
    receivedOn: TODAY,
    receiptNumber: 'RCPT-0001',
    fileId: null,
    recordedAt: AT,
    recordedBy: READER,
    reversesId: null,
    reason: null,
    reversed: false,
  } as ProjectPayments['entries'][number]);
  return after;
}

/* By domain's rules, never by spelling: whose home holds Money due, who opens the collections row. */
function presetWhere(test: (role: RolePreset) => boolean): RolePreset {
  const found = ROLE_PRESETS.find(test);
  if (found === undefined) throw new Error('no preset fits');
  return found;
}
const seesMoneyDue = (role: RolePreset) => showsMoneyDue(composedHome([role]));
const setsCollections = (role: RolePreset) => opensSettingsRow([role], 'collections');
export const MONEY_OWNER = presetWhere((role) => seesMoneyDue(role) && setsCollections(role));
export const NO_MONEY_DUE = presetWhere((role) => !seesMoneyDue(role) && !setsCollections(role));

export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  roles: readonly RolePreset[];
  due: MoneyDue;
  settings: CollectionsSettings;
  /** The next answers to a write, in order, keyed by its last path segment. */
  answers: Map<string, Answer[]>;
  sent: string[];
  writes: { path: string; body: unknown; key: string }[];
  /** Each retry key's first body. */
  keyed: Map<string, string>;
  /** The receipt PDF's link, or null while it is still made. */
  receiptPdf: { url: string; expiresAt: string } | null;
}

const START = (): Origin => ({
  roles: [MONEY_OWNER],
  due: moneyDueOf(1, 1, 1),
  settings: collections('epc@okaxis'),
  answers: new Map(),
  sent: [],
  writes: [],
  keyed: new Map(),
  receiptPdf: { url: 'https://store/rcpt.pdf', expiresAt: '2099-01-01T00:00:00.000Z' },
});

export const origin: Origin = START();

export function answerNext(key: string, ...answers: Answer[]) {
  origin.answers.set(key, [...(origin.answers.get(key) ?? []), ...answers]);
}

/** A money act refused with domain's reason (`PAYMENT_ACT_REFUSED`). */
export const paymentRefused = (reason: string, receiptNumber: string | null) => ({
  error: { ...refusal('PAYMENT_ACT_REFUSED').error, facts: { refusal: reason, receiptNumber } },
});

export const readsOf = (prefix: string) =>
  origin.sent.filter((one) => one.startsWith(`GET ${prefix}`));

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
  const retryKey = String(req.headers[IDEMPOTENCY_KEY_HEADER] ?? '');
  origin.writes.push({ path: url.pathname, body: write.body, key: retryKey });
  /* As the api does: a key sent again with a different body is refused, never applied. */
  const first = origin.keyed.get(retryKey);
  const body = JSON.stringify(write.body);
  if (retryKey !== '' && first !== undefined && first !== body) {
    return send(res, req, 422, refusal('IDEMPOTENCY_KEY_REUSED'));
  }
  if (retryKey !== '') origin.keyed.set(retryKey, body);
  const key = url.pathname.split('/').at(-1) ?? '';
  const answer = origin.answers.get(key)?.shift() ?? success;
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

/** A receipt photo's declare — answered as the next `files` answer says — its PUT, and complete. */
function answeredFile(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/files') {
    const upload = {
      url: `${served.url()}/store/${FILE_ID}`,
      method: 'PUT',
      headers: {},
      expiresAt: '2099-01-01T00:00:00.000Z',
    };
    const stored = { ...storedFile(null), subjectKind: 'project_payment', subjectRef: ENTRY };
    void answerWrite(req, res, { status: 201, body: { file: stored, upload } });
  } else if (path === `/files/${FILE_ID}/complete`) {
    void answerWrite(req, res, { status: 200, body: storedFile(AT) });
  } else if (path.startsWith('/store/')) {
    req.resume().on('end', () => send(res, req, 200));
  } else return false;
  return true;
}

const PAYMENTS_PATH = `/projects/${PROJECT_ID}/payments`;

function answerMoney(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (req.method === 'GET' && path === PAYMENTS_PATH) send(res, req, 200, somePayments());
  else if (req.method === 'POST' && path === PAYMENTS_PATH) {
    void answerWrite(req, res, { status: 201, body: { ...paid(), recordedId: ENTRY } });
  } else if (req.method === 'POST' && path.startsWith(`/projects/${PROJECT_ID}/`)) {
    void answerWrite(req, res, { status: 200, body: somePayments() });
  } else if (path === '/payments/due') send(res, req, 200, duePage(req));
  else if (req.method === 'GET' && path === '/settings/collections') {
    send(res, req, 200, origin.settings);
  } else if (req.method === 'PUT' && path === '/settings/collections') {
    void answerWrite(req, res, { status: 200, body: collections('new@okicici') });
  } else return false;
  return true;
}

/** Money due as the api pages it: one group's rows alone when asked, never more than the limit. */
function duePage(req: IncomingMessage) {
  const asked = new URL(req.url ?? '/', 'http://origin').searchParams;
  const group = asked.get('group');
  const limit = Number(asked.get('limit') ?? origin.due.rows.items.length);
  const listed = origin.due.rows.items.filter((row) => group === null || row.group === group);
  return { ...origin.due, rows: { items: listed.slice(0, limit), totalCount: listed.length } };
}

/** The reference check and the receipt PDF's link. */
function answerReceipts(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/payments/references') {
    const asked = new URL(req.url ?? '/', 'http://origin').searchParams.get('reference');
    send(res, req, 200, { receiptNumber: asked === USED_UTR ? 'RCPT-0007' : null });
  } else if (path.endsWith('/receipt-pdf')) send(res, req, 200, { download: origin.receiptPdf });
  else return false;
  return true;
}

const served = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  const path = url.pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.sent.push(`${req.method} ${path}${url.search}`);
  if (path === '/auth/session') return send(res, req, 200, projection());
  if (answerMoney(req, res, path) || answerReceipts(req, res, path)) return;
  if (answeredFile(req, res, path)) return;
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
