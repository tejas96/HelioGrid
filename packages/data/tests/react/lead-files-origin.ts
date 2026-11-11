import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  IDEMPOTENCY_KEY_HEADER,
  type LeadFile,
  type SessionProjection,
} from '@heliogrid/contracts';
import { can, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * A lead's files end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that keeps one lead's files, stores a file through the file routes, puts it on the lead
 * the way the api does — the same file again adds nothing — and answers a case the way it needs:
 * queued, held or dropped.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const id = (n: number) => `01a50000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const TENANT = id(1);
export const READER = { userId: id(2), name: 'Asha Patil' };
export const LEAD_ID = id(101);
export const FILE_ID = id(401);
export const AT = '2026-11-10T05:00:00.000Z';
export const LINK = 'https://store.example/bill.pdf';

/* By the matrix, never by spelling: who may add a file to a lead is F2's. */
const addsFiles = (role: RolePreset) => can([role], 'crm.add_edit_leads');
function presetWhere(test: (role: RolePreset) => boolean): RolePreset {
  const found = ROLE_PRESETS.find(test);
  if (found === undefined) throw new Error('no preset fits');
  return found;
}
export const ADDS_ROLE = presetWhere(addsFiles);
export const READS_ONLY_ROLE = presetWhere((role) => !addsFiles(role));

/** A file on the lead as the api lists it. */
export const aLeadFile = (n: number, name: string): LeadFile => ({
  id: id(500 + n),
  fileId: id(400 + n),
  name,
  contentType: 'application/pdf',
  addedAt: AT,
  addedBy: READER,
});

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  roles: readonly RolePreset[];
  files: LeadFile[];
  /** The next answers to a write, in order, keyed `declare`, `complete` or `attach`. */
  answers: Map<string, Answer[]>;
  /** While set, every write waits for it — the upload is out until the test lets it go. */
  gate: Promise<void> | null;
  /** Every request's method and path, in order. */
  sent: string[];
  writes: { path: string; body: unknown; key: string }[];
}

const START = (): Origin => ({
  roles: [ADDS_ROLE],
  files: [],
  answers: new Map(),
  gate: null,
  sent: [],
  writes: [],
});

export const origin: Origin = START();

/** Queues `answers` for the next writes naming `key`. */
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

const storedFile = (uploadedAt: string | null) => ({
  id: FILE_ID,
  subjectKind: 'lead',
  subjectRef: LEAD_ID,
  contentType: 'application/pdf',
  byteSize: 4,
  checksumSha256: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
  uploadedAt,
});

/** The lead's files once a file is put on it: the same file again adds nothing. */
function attached(body: { fileId: string; name: string }): LeadFile[] {
  if (origin.files.some((one) => one.fileId === body.fileId)) return origin.files;
  const added = { ...aLeadFile(origin.files.length + 1, body.name), fileId: body.fileId };
  origin.files = [...origin.files, added];
  return origin.files;
}

/** A write: the next answer queued for `key`, else what the route answers on success. */
async function answerWrite(
  req: IncomingMessage,
  res: ServerResponse,
  key: string,
  success: (body: unknown) => Answer,
) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const retryKey = String(req.headers[IDEMPOTENCY_KEY_HEADER] ?? '');
  origin.writes.push({ path, body: write.body, key: retryKey });
  if (origin.gate !== null) await origin.gate;
  const answer = origin.answers.get(key)?.shift() ?? success(write.body);
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

function answered(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === `/leads/${LEAD_ID}/files` && req.method === 'POST') {
    const attach = (body: unknown) => ({
      status: 200,
      body: { items: attached(body as { fileId: string; name: string }) },
    });
    void answerWrite(req, res, 'attach', attach);
  } else if (path === '/files') {
    const upload = {
      url: `${served.url()}/store/${FILE_ID}`,
      method: 'PUT',
      headers: {},
      expiresAt: '2099-01-01T00:00:00.000Z',
    };
    const declared = { file: storedFile(null), upload };
    void answerWrite(req, res, 'declare', () => ({ status: 201, body: declared }));
  } else if (path === `/files/${FILE_ID}/complete`) {
    void answerWrite(req, res, 'complete', () => ({ status: 200, body: storedFile(AT) }));
  } else if (path.startsWith('/store/')) {
    req.resume().on('end', () => send(res, req, 200));
  } else return false;
  return true;
}

const served = listeningOrigin((req, res) => {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.sent.push(`${req.method} ${path}`);
  if (path === '/auth/session') return send(res, req, 200, projection());
  if (path === `/leads/${LEAD_ID}/files` && req.method === 'GET') {
    return send(res, req, 200, { items: origin.files });
  }
  if (path === `/files/${FILE_ID}/download-url`) {
    return send(res, req, 200, { url: LINK, expiresAt: '2099-01-01T00:00:00.000Z' });
  }
  if (!answered(req, res, path)) send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, START());
});

/** A hook mounted in the real provider over the origin. */
export function mountedOver<P, T>(hook: (props: P) => T, initialProps?: P) {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper, initialProps });
}

/** How many times `path` was read. */
export const readsOf = (path: string) => origin.sent.filter((one) => one === `GET ${path}`).length;

/** Long enough for a read the hook would send to have reached the origin. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
